import { NextRequest, NextResponse } from 'next/server';

/**
 * Détection du pays du visiteur pour la préselection de l'indicatif téléphonique.
 *
 * Stratégie (du plus fiable au moins coûteux) :
 *  1. Header `cf-ipcountry` (si le site passe derrière Cloudflare) — instantané, gratuit
 *  2. Cache mémoire 24 h — évite de brûler le quota des APIs de géoloc
 *     (ipapi.co gratuit ≈ 1 000 requêtes/mois) pour les IPs déjà vues
 *  3. ipapi.co puis ipwho.is (2ᵉ fournisseur de secours)
 *  4. Échec → `detected: false` + pays par défaut : le client appliquera alors
 *     ses propres replis locaux (région des locales navigateur → fuseau horaire)
 *
 * ⚠️ Contrat client : le hook useTranslation n'accepte le résultat du serveur
 * QUE si `detected === true`. Un serveur qui n'a rien résolu ne doit JAMAIS
 * forcer 'FR' chez le client.
 */

interface GeoProviderResponse {
  country_code?: string;
  country?: string;
  error?: boolean | string;
  reason?: string;
  success?: boolean;
  message?: string;
}

// ─── Cache mémoire (par instance de serveur) ────────────────────────────────
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 h
const CACHE_MAX_ENTRIES = 5000;
const geoCache = new Map<string, { country: string; name: string; ts: number }>();

function cacheGet(ip: string): { country: string; name: string } | null {
  const hit = geoCache.get(ip);
  if (!hit) return null;
  if (Date.now() - hit.ts > CACHE_TTL_MS) {
    geoCache.delete(ip);
    return null;
  }
  return { country: hit.country, name: hit.name };
}

function cacheSet(ip: string, country: string, name: string): void {
  // Garde-fou mémoire : éviction FIFO du plus ancien
  if (geoCache.size >= CACHE_MAX_ENTRIES) {
    const oldest = geoCache.keys().next().value;
    if (oldest) geoCache.delete(oldest);
  }
  geoCache.set(ip, { country, name, ts: Date.now() });
}

// ─── Utilitaires ────────────────────────────────────────────────────────────

const PRIVATE_IP_RE =
  /^(::1|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|fc|fd|fe80|localhost|::ffff:127\.)/i;

function isValidCountryCode(cc: unknown): cc is string {
  return typeof cc === 'string' && /^[A-Za-z]{2}$/.test(cc) && cc.toUpperCase() !== 'XX';
}

async function lookupIpapi(ip: string): Promise<GeoProviderResponse> {
  const res = await fetch(`https://ipapi.co/${ip}/json/`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(3500),
  });
  if (!res.ok) throw new Error(`ipapi.co HTTP ${res.status}`);
  const data: GeoProviderResponse = await res.json();
  if (data.error) throw new Error(data.reason || 'ipapi.co error');
  return data;
}

async function lookupIpwho(ip: string): Promise<GeoProviderResponse> {
  const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(3500),
  });
  if (!res.ok) throw new Error(`ipwho.is HTTP ${res.status}`);
  const data: GeoProviderResponse = await res.json();
  if (data.success === false) throw new Error(data.message || 'ipwho.is error');
  return data;
}

export async function GET(request: NextRequest) {
  try {
    // ── 1. IP client (derrière proxy : premier élément public de la chaîne) ──
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const cfIp = request.headers.get('cf-connecting-ip');
    const candidates = [
      ...(forwardedFor?.split(',') ?? []).map(s => s.trim()),
      realIp ?? '',
      cfIp ?? '',
    ].filter(Boolean);
    const clientIp = candidates.find(c => !PRIVATE_IP_RE.test(c)) ?? candidates[0] ?? '';

    // ── 2. Header pays Cloudflare : gratuit et instantané quand présent ──
    const cfCountry = request.headers.get('cf-ipcountry');
    if (isValidCountryCode(cfCountry) && cfCountry) {
      return NextResponse.json({
        countryCode: cfCountry.toUpperCase(),
        country: cfCountry.toUpperCase(),
        ip: clientIp || 'unknown',
        detected: true,
        source: 'cf-ipcountry',
      });
    }

    // ── 3. IP privée / locale (dev, sandbox) : rien à géolocaliser ──
    if (!clientIp || PRIVATE_IP_RE.test(clientIp)) {
      const defaultCountry = process.env.DEFAULT_COUNTRY || 'FR';
      return NextResponse.json({
        countryCode: defaultCountry,
        country: defaultCountry === 'FR' ? 'France' : defaultCountry,
        ip: clientIp || 'unknown',
        detected: false, // ← le client appliquera ses replis locaux
        isPrivate: true,
      });
    }

    // ── 4. Cache (24 h) : même IP → pas de 2ᵉ appel API ──
    const cached = cacheGet(clientIp);
    if (cached) {
      return NextResponse.json({
        countryCode: cached.country,
        country: cached.name,
        ip: clientIp,
        detected: true,
        cached: true,
      });
    }

    // ── 5. Fournisseurs en cascade : ipapi.co → ipwho.is ──
    const providers: Array<{ name: string; fn: (ip: string) => Promise<GeoProviderResponse> }> = [
      { name: 'ipapi.co', fn: lookupIpapi },
      { name: 'ipwho.is', fn: lookupIpwho },
    ];

    for (const provider of providers) {
      try {
        const data = await provider.fn(clientIp);
        if (isValidCountryCode(data.country_code)) {
          const cc = data.country_code.toUpperCase();
          cacheSet(clientIp, cc, data.country || cc);
          return NextResponse.json({
            countryCode: cc,
            country: data.country || cc,
            ip: clientIp,
            detected: true,
            source: provider.name,
          });
        }
      } catch (err) {
        console.warn(`[detect-country] ${provider.name} failed for ${clientIp}:`, err instanceof Error ? err.message : err);
      }
    }

    // ── 6. Tous les fournisseurs ont échoué → pas de forçage côté client ──
    const defaultCountry = process.env.DEFAULT_COUNTRY || 'FR';
    return NextResponse.json({
      countryCode: defaultCountry,
      country: defaultCountry === 'FR' ? 'France' : defaultCountry,
      ip: clientIp,
      detected: false,
      error: true,
    });
  } catch (error) {
    console.error('[detect-country] Unexpected error:', error);
    const defaultCountry = process.env.DEFAULT_COUNTRY || 'FR';
    return NextResponse.json({
      countryCode: defaultCountry,
      country: defaultCountry === 'FR' ? 'France' : defaultCountry,
      ip: 'unknown',
      detected: false,
      error: true,
    });
  }
}
