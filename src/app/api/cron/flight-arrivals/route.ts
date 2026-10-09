/* ─────────────────────────────────────────────────────────────────────────
 * ⏰ CRON — Notifications de vol (statut fournisseur : AirLabs/Amadeus + OneSignal)
 *
 * Appelé toutes les 10 min par le mini-service flight-cron (Bearer CRON_SECRET).
 *
 * Pour chaque bagage ACTIVÉ avec consentement notifications et vol saisi :
 *   ✈️ PRE-FLIGHT  — « Bon vol ! » entre T-2h et T (décollage, heure du
 *                    fournisseur de statut si dispo, sinon heure saisie à
 *                    l'activation). Expire silencieusement si la fenêtre est passée.
 *   🛬 ARRIVAL     — « Bienvenue à destination ! » entre A+15 min et A+3h
 *                    après l'atterrissage (temps RÉEL si le fournisseur de
 *                    statut le fournit, sinon estimé, sinon prévu).
 *
 * Un seul appel fournisseur par vol unique (cache 8 min) sert aux deux checks.
 * Anti-doublon : flags preFlightNotifiedAt / arrivalNotifiedAt sur Baggage.
 * Jamais bloquant : toute erreur est loggée et le vol suivant continue.
 * ───────────────────────────────────────────────────────────────────────── */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isFlightApiConfigured, currentProvider, getFlightStatus, resolveCarrierCode, parseFlightNumber } from '@/lib/flight-api';
import { sendFlightArrivalPush, sendPreFlightPush } from '@/lib/onesignal';

function trackingUrl(reference: string): string {
  const base =
    process.env.ONESIGNAL_SITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    'https://qrbags.com';
  return `${base}/suivi/${reference}`;
}

/** Date de départ ISO (YYYY-MM-DD) pour Amadeus + Date naïve de décollage (fallback) */
function departureInfo(departureDate: Date | null, departureTime: string | null) {
  if (!departureDate) return null;
  const isoDate = departureDate.toISOString().slice(0, 10);
  let naiveDepartAt: Date | null = null;
  const m = departureTime?.trim().match(/^(\d{1,2}):(\d{2})/);
  if (m) {
    // Heure saisie = heure locale aéroport. Sans fuseau connu, on la traite en UTC
    // (précision ±fuseau ; corrigée automatiquement dès qu'Amadeus fournit l'offset).
    naiveDepartAt = new Date(`${isoDate}T${m[1].padStart(2, '0')}:${m[2]}:00Z`);
  }
  return { isoDate, naiveDepartAt };
}

async function runCron() {
  const now = Date.now();
  const summary = {
    flightApiProvider: currentProvider(),
    candidates: 0,
    flightsQueried: 0,
    preFlightSent: 0,
    preFlightExpired: 0,
    arrivalsSent: 0,
    arrivalsExpired: 0,
    skipped: 0,
    errors: [] as string[],
  };

  // Fenêtre de recherche : vols dont la date de départ est entre hier et demain
  const windowStart = new Date(now - 36 * 3600 * 1000);
  const windowEnd = new Date(now + 36 * 3600 * 1000);

  const candidates = await db.baggage.findMany({
    where: {
      activatedAt: { not: null },
      notifyConsent: true,
      transportMode: 'flight',
      flightNumber: { not: null },
      departureDate: { gte: windowStart, lte: windowEnd },
      OR: [{ preFlightNotifiedAt: null }, { arrivalNotifiedAt: null }],
    },
    select: {
      id: true,
      reference: true,
      destination: true,
      airlineName: true,
      flightNumber: true,
      departureDate: true,
      departureTime: true,
      travelerFirstName: true,
      preFlightNotifiedAt: true,
      arrivalNotifiedAt: true,
    },
  });
  summary.candidates = candidates.length;

  // Cache du statut par vol unique — partagé entre bagages du même vol
  const flightStatusCache = new Map<string, Awaited<ReturnType<typeof getFlightStatus>>>();

  const getFlight = async (carrier: string | null, number: string | null, isoDate: string) => {
    if (!carrier || !number) return null;
    const key = `${carrier}/${number}/${isoDate}`;
    if (!flightStatusCache.has(key)) {
      flightStatusCache.set(key, await getFlightStatus(carrier, number, isoDate));
    }
    return flightStatusCache.get(key) ?? null;
  };

  for (const bag of candidates) {
    try {
      const depInfo = departureInfo(bag.departureDate, bag.departureTime);
      if (!depInfo || !bag.flightNumber) {
        summary.skipped++;
        continue;
      }

      // Résolution du code IATA compagnie + numéro de vol propres
      const carrier =
        resolveCarrierCode(bag.airlineName) || parseFlightNumber(bag.flightNumber)?.carrier || null;
      const flightNum = parseFlightNumber(bag.flightNumber)?.number || null;

      // ── Statut du vol (1 appel par vol unique, partagé) ──
      let status: Awaited<ReturnType<typeof getFlightStatus>> = null;
      if (isFlightApiConfigured()) {
        status = await getFlight(carrier, flightNum, depInfo.isoDate);
        if (status) summary.flightsQueried++;
      }

      // ── ✈️ PRE-FLIGHT « Bon vol » ──
      if (!bag.preFlightNotifiedAt) {
        // Priorité à l'heure du fournisseur (bon fuseau + retard éventuel), fallback heure saisie
        const departAt = status?.departureAt ?? depInfo.naiveDepartAt;
        if (departAt) {
          const t = departAt.getTime();
          const twoHours = 2 * 3600 * 1000;
          if (now >= t - twoHours && now <= t) {
            const r = await sendPreFlightPush({
              reference: bag.reference,
              firstName: bag.travelerFirstName,
              airline: bag.airlineName,
              flightNumber: bag.flightNumber,
              trackingUrl: trackingUrl(bag.reference),
            });
            if (r.ok) {
              summary.preFlightSent++;
              await db.baggage.update({
                where: { id: bag.id },
                data: { preFlightNotifiedAt: new Date() },
              });
            } else {
              summary.errors.push(`pre_flight ${bag.reference}: ${r.status}`);
            }
          } else if (now > t) {
            // Fenêtre dépassée (ex: serveur arrêté au moment du vol) — expire silencieusement
            summary.preFlightExpired++;
            await db.baggage.update({
              where: { id: bag.id },
              data: { preFlightNotifiedAt: new Date() },
            });
          }
        }
      }

      // ── 🛬 ARRIVAL « Bienvenue à destination » ──
      if (!bag.arrivalNotifiedAt && status?.arrivalAt) {
        const a = status.arrivalAt.getTime();
        const fifteenMin = 15 * 60 * 1000;
        const threeHours = 3 * 3600 * 1000;
        if (now >= a + fifteenMin && now <= a + threeHours) {
          const r = await sendFlightArrivalPush({
            reference: bag.reference,
            destination: bag.destination,
            trackingUrl: trackingUrl(bag.reference),
          });
          if (r.ok) {
            summary.arrivalsSent++;
            await db.baggage.update({
              where: { id: bag.id },
              data: { arrivalNotifiedAt: new Date() },
            });
          } else {
            summary.errors.push(`arrival ${bag.reference}: ${r.status}`);
          }
        } else if (now > a + threeHours) {
          // Atterrissage trop ancien (serveur à l'arrêt, vol ancien) — expire
          summary.arrivalsExpired++;
          await db.baggage.update({
            where: { id: bag.id },
            data: { arrivalNotifiedAt: new Date() },
          });
        }
      }
    } catch (e) {
      summary.errors.push(`${bag.reference}: ${e instanceof Error ? e.message : 'unknown'}`);
    }
  }

  return summary;
}

function authorize(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true; // pas de secret configuré → ouvert (dev local)
  const auth = request.headers.get('authorization');
  if (auth === `Bearer ${cronSecret}`) return true;
  // Autoriser aussi le secret en query (facilite les déclencheurs externes)
  return request.nextUrl.searchParams.get('secret') === cronSecret;
}

export async function POST(request: NextRequest) {
  if (!authorize(request)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  try {
    const summary = await runCron();
    return NextResponse.json({ success: true, ...summary });
  } catch (error) {
    console.error('[Cron flight-arrivals] erreur:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET pratique pour un test manuel navigateur/curl (même logique, même secret)
export async function GET(request: NextRequest) {
  return POST(request);
}
