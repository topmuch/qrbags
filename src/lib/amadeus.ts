/* ─────────────────────────────────────────────────────────────────────────
 * ✈️ AMADEUS FLIGHT STATUS — heure d'arrivée réelle/estimée d'un vol
 *
 * Utilisé par le cron /api/cron/flight-arrivals pour déclencher la
 * notification « 🛬 Bienvenue à destination ! » ~15 min après l'atterrissage
 * (temps RÉEL si disponible, sinon estimé, sinon prévu).
 *
 * Auth : OAuth2 client_credentials (token mis en cache ~30 min).
 * API  : GET /v2/schedule/flights?carrierCode=AF&flightNumber=029&scheduledDepartureDate=…
 *
 * Graceful degradation : pas de clés / réseau bloqué / réponse inattendue →
 * null, JAMAIS d'exception (le cron continue sur les autres vols).
 * ───────────────────────────────────────────────────────────────────────── */

const TOKEN_TTL_MS = 25 * 60 * 1000; // Amadeus tokens vivent 30 min — marge de sécurité
const CACHE_TTL_MS = 8 * 60 * 1000; // Ne re-questionne pas un vol avant 8 min (cron 10 min)

interface TokenState {
  token: string;
  fetchedAt: number;
}
let tokenState: TokenState | null = null;
let tokenPending: Promise<string | null> | null = null;

const flightCache = new Map<string, { at: number; data: FlightArrivalInfo | null }>();

export function isAmadeusConfigured(): boolean {
  return Boolean(process.env.AMADEUS_API_KEY && process.env.AMADEUS_API_SECRET);
}

function amadeusHost(): string {
  return process.env.AMADEUS_HOST || 'https://test.api.amadeus.com';
}

/* ─── OAuth2 — token mémoïsé, refresh automatique ─── */
async function getAccessToken(): Promise<string | null> {
  if (!isAmadeusConfigured()) return null;
  if (tokenState && Date.now() - tokenState.fetchedAt < TOKEN_TTL_MS) {
    return tokenState.token;
  }
  if (tokenPending) return tokenPending;

  tokenPending = (async () => {
    try {
      const res = await fetch(`${amadeusHost()}/v1/security/oauth2/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: process.env.AMADEUS_API_KEY!,
          client_secret: process.env.AMADEUS_API_SECRET!,
        }),
        signal: AbortSignal.timeout(8000),
        cache: 'no-store',
      });
      if (!res.ok) {
        console.warn(`[Amadeus] OAuth échoué: HTTP ${res.status}`);
        return null;
      }
      const json = (await res.json()) as { access_token?: string };
      if (!json.access_token) return null;
      tokenState = { token: json.access_token, fetchedAt: Date.now() };
      return json.access_token;
    } catch (e) {
      console.warn('[Amadeus] OAuth erreur (non bloquant):', e instanceof Error ? e.message : e);
      return null;
    } finally {
      tokenPending = null;
    }
  })();

  return tokenPending;
}

/* ─── Types de réponse On Demand Flight Status ───
 * Deux shapes connus selon la version API :
 *  - v2 « timings » : flightPoints[i].arrival.timings[] = [{ qualifier: 'STA'|'ETA'|'ATA', value }]
 *  - legacy         : flightPoints[i].arrival.{scheduledTime|estimatedTime|actualTime}
 * Les valeurs ISO portent l'offset de l'aéroport (« 2026-06-15T04:55:00+02:00 ») ;
 * si l'offset manque on traite comme UTC (déclenchement ±décalage horaire, acceptable). */

export interface FlightStatusInfo {
  departureAt: Date | null; // actual ?? estimated ?? scheduled (décollage)
  arrivalAt: Date | null; // actual ?? estimated ?? scheduled (atterrissage)
  arrivalIata?: string;
  departureIata?: string;
  arrivalSource: 'actual' | 'estimated' | 'scheduled' | 'none';
  departureSource: 'actual' | 'estimated' | 'scheduled' | 'none';
}

type AmadeusTiming = { qualifier?: string; value?: string };
type AmadeusFlightPoint = {
  iataCode?: string;
  departure?: {
    scheduledTime?: string;
    estimatedTime?: string;
    actualTime?: string;
    timings?: AmadeusTiming[];
  };
  arrival?: {
    scheduledTime?: string;
    estimatedTime?: string;
    actualTime?: string;
    timings?: AmadeusTiming[];
  };
};
type AmadeusFlightEntry = {
  scheduledDepartureDate?: string;
  flightPoints?: AmadeusFlightPoint[];
};

const ARRIVAL_QUALIFIER_ORDER = ['ATA', 'ETA', 'STA'] as const; // actual → estimated → scheduled
const ARRIVAL_SOURCE_BY_QUALIFIER: Record<string, 'actual' | 'estimated' | 'scheduled'> = {
  ATA: 'actual',
  ETA: 'estimated',
  STA: 'scheduled',
};

const DEPARTURE_QUALIFIER_ORDER = ['ATD', 'ETD', 'STD'] as const; // actual → estimated → scheduled
const DEPARTURE_SOURCE_BY_QUALIFIER: Record<string, 'actual' | 'estimated' | 'scheduled'> = {
  ATD: 'actual',
  ETD: 'estimated',
  STD: 'scheduled',
};

function parseIso(value?: string): Date | null {
  if (!value) return null;
  // Sans offset explicite → UTC (les instants restent comparables entre eux)
  const iso = /[Z+]/.test(value.slice(10)) ? value : `${value}Z`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function bestTime(
  raw: { scheduledTime?: string; estimatedTime?: string; actualTime?: string; timings?: AmadeusTiming[] } | undefined,
  qualifierOrder: readonly string[],
  sourceByQualifier: Record<string, 'actual' | 'estimated' | 'scheduled'>
): { at: Date; source: 'actual' | 'estimated' | 'scheduled' } | null {
  if (!raw) return null;

  // Shape « timings » (avec priorité actual > estimated > scheduled)
  if (Array.isArray(raw.timings)) {
    for (const q of qualifierOrder) {
      const t = raw.timings.find((x) => x?.qualifier === q && x.value);
      const at = parseIso(t?.value);
      if (at) return { at, source: sourceByQualifier[q] };
    }
  }

  // Shape legacy (fallback)
  const actual = parseIso(raw.actualTime);
  const estimated = parseIso(raw.estimatedTime);
  const scheduled = parseIso(raw.scheduledTime);
  if (actual) return { at: actual, source: 'actual' };
  if (estimated) return { at: estimated, source: 'estimated' };
  if (scheduled) return { at: scheduled, source: 'scheduled' };
  return null;
}

function extractFlightTimes(entry: AmadeusFlightEntry): FlightStatusInfo | null {
  const points = entry.flightPoints;
  if (!points || points.length < 2) return null;
  const first = points[0];
  const last = points[points.length - 1];

  const departure = bestTime(first.departure, DEPARTURE_QUALIFIER_ORDER, DEPARTURE_SOURCE_BY_QUALIFIER);
  const arrival = bestTime(last.arrival, ARRIVAL_QUALIFIER_ORDER, ARRIVAL_SOURCE_BY_QUALIFIER);

  if (!departure && !arrival) return null;
  return {
    departureAt: departure?.at ?? null,
    arrivalAt: arrival?.at ?? null,
    departureIata: first.iataCode,
    arrivalIata: last.iataCode,
    departureSource: departure?.source ?? 'none',
    arrivalSource: arrival?.source ?? 'none',
  };
}

/* ─── Mapping nom de compagnie → code IATA (saisie libre du voyageur) ─── */
const CARRIER_MAP: Record<string, string> = {
  'air france': 'AF',
  'royal air maroc': 'AT',
  ram: 'AT',
  tunisair: 'TU',
  'air algerie': 'AH',
  egyptair: 'MS',
  saudia: 'SV',
  'saudi arabian airlines': 'SV',
  emirates: 'EK',
  'qatar airways': 'QR',
  qatar: 'QR',
  etihad: 'EY',
  'turkish airlines': 'TK',
  turkish: 'TK',
  lufthansa: 'LH',
  'british airways': 'BA',
  iberia: 'IB',
  klm: 'KL',
  'ita airways': 'AZ',
  'brussels airlines': 'SN',
  swiss: 'LX',
  austrian: 'OS',
  finnair: 'AY',
  easyjet: 'U2',
  ryanair: 'FR',
  vueling: 'VY',
  transavia: 'TO',
  corsair: 'SS',
  'french bee': 'BF',
  'air caraibes': 'TX',
  ethiopian: 'ET',
  'kenya airways': 'KQ',
  rwandair: 'WB',
  'air senegal': 'S9',
  'air europa': 'UX',
  'air transat': 'TS',
  'fly dubai': 'FZ',
  flydubai: 'FZ',
  'air arabia': 'G9',
  'oman air': 'WY',
  'royal jordanian': 'RJ',
  pegasus: 'PC',
  delta: 'DL',
  united: 'UA',
  'american airlines': 'AA',
  'air canada': 'AC',
  wizz: 'W6',
};

function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** « Air France », « royal air maroc », « AF » → code IATA. null si inconnu. */
export function resolveCarrierCode(airlineName?: string | null): string | null {
  if (!airlineName) return null;
  const n = normalizeName(airlineName);
  if (!n) return null;
  if (CARRIER_MAP[n]) return CARRIER_MAP[n];
  // Compagnies connues avec variantes (« air france », « airfrance »)
  for (const [k, v] of Object.entries(CARRIER_MAP)) {
    if (n.includes(k) || k.includes(n)) return v;
  }
  // Le voyageur a peut-être saisi le code IATA directement (« AF », « EK »)
  if (/^[a-z0-9]{2}$/.test(n)) return n.toUpperCase();
  return null;
}

/** « AF 1234 », « AF1234 », « af 029 » → { carrier: 'AF', number: '1234' } */
export function parseFlightNumber(raw?: string | null): { carrier: string | null; number: string | null } | null {
  if (!raw) return null;
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!cleaned) return null;
  const m = cleaned.match(/^([A-Z]{2})(\d{1,4})$/);
  if (m) return { carrier: m[1], number: m[2] };
  // Numéro seul (la compagnie est dans airlineName) ou préfixe 1 lettre (ex: « T7 »)
  const digits = cleaned.match(/(\d{1,4})$/);
  return { carrier: null, number: digits ? digits[1] : null };
}

/* ─── Recherche du vol (avec cache 8 min pour ne pas brûler le quota) ───
 * Un seul appel par vol sert aux DEUX notifications : départ (Bon vol T-2h)
 * et arrivée (Bienvenue à l'atterrissage). */
export async function getFlightStatus(
  carrierCode: string,
  flightNumber: string,
  scheduledDepartureDate: string // « 2026-06-15 »
): Promise<FlightStatusInfo | null> {
  if (!isAmadeusConfigured()) return null;

  const cacheKey = `${carrierCode}${flightNumber}@${scheduledDepartureDate}`;
  const cached = flightCache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.data;

  const token = await getAccessToken();
  if (!token) return null;

  const attempt = async (num: string): Promise<FlightStatusInfo | null> => {
    const url = `${amadeusHost()}/v2/schedule/flights?carrierCode=${encodeURIComponent(
      carrierCode
    )}&flightNumber=${encodeURIComponent(num)}&scheduledDepartureDate=${encodeURIComponent(scheduledDepartureDate)}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });
    if (res.status === 401) {
      tokenState = null; // token expiré → re-auth au prochain cycle
      return null;
    }
    if (!res.ok) {
      console.warn(`[Amadeus] Recherche vol ${carrierCode}${num} → HTTP ${res.status}`);
      return null;
    }
    const json = (await res.json()) as { data?: AmadeusFlightEntry[] };
    const flights = Array.isArray(json.data) ? json.data : [];
    const entry =
      flights.find((f) => f.scheduledDepartureDate === scheduledDepartureDate) || flights[0];
    return entry ? extractFlightTimes(entry) : null;
  };

  try {
    let info = await attempt(flightNumber);
    // Certains vols exigent le zéro initial (AF 29 → « 029 »)
    if (!info && flightNumber.length < 3) {
      info = await attempt(flightNumber.padStart(3, '0'));
    }
    flightCache.set(cacheKey, { at: Date.now(), data: info });
    return info;
  } catch (e) {
    console.warn('[Amadeus] Recherche vol échouée (non bloquant):', e instanceof Error ? e.message : e);
    flightCache.set(cacheKey, { at: Date.now(), data: null });
    return null;
  }
}
