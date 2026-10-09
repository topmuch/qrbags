/* ─────────────────────────────────────────────────────────────────────────
 * ✈️ FLIGHT API — façade multi-fournisseur pour le statut des vols
 *
 * Pourquoi ? Amadeus a fermé l'inscription libre en 2026 (portail devenu
 * « member login »). AirLabs.co offre un plan gratuit à 10 000 requêtes/mois
 * avec inscription immédiate → fournisseur par défaut.
 *
 * Sélection automatique (FLIGHT_API_PROVIDER pour forcer) :
 *   1. airlabs   — si AIRLABS_API_KEY est défini          ← reco
 *   2. amadeus   — si AMADEUS_API_KEY + SECRET sont définis (compte existant)
 *
 * Contract unique pour le cron /api/cron/flight-arrivals :
 *   getFlightStatus(carrier, number, dateISO) → FlightStatusInfo | null
 * Toutes les erreurs sont non bloquantes (null, jamais d'exception).
 * ───────────────────────────────────────────────────────────────────────── */

import { getFlightStatus as amadeusGetFlightStatus, isAmadeusConfigured } from './amadeus';

export type FlightProvider = 'airlabs' | 'amadeus' | 'none';

export interface FlightStatusInfo {
  departureAt: Date | null;
  arrivalAt: Date | null;
  arrivalIata?: string;
  departureIata?: string;
  arrivalSource: 'actual' | 'estimated' | 'scheduled' | 'none';
  departureSource: 'actual' | 'estimated' | 'scheduled' | 'none';
}

export { resolveCarrierCode, parseFlightNumber } from './amadeus';

export function currentProvider(): FlightProvider {
  const forced = process.env.FLIGHT_API_PROVIDER?.trim().toLowerCase();
  if (forced === 'airlabs' && process.env.AIRLABS_API_KEY) return 'airlabs';
  if (forced === 'amadeus' && isAmadeusConfigured()) return 'amadeus';
  if (process.env.AIRLABS_API_KEY) return 'airlabs';
  if (isAmadeusConfigured()) return 'amadeus';
  return 'none';
}

export function isFlightApiConfigured(): boolean {
  return currentProvider() !== 'none';
}

/* ─────────────────────────────────────────────────────────────────────────
 * Provider AirLabs (https://airlabs.co — plan FREE 10 000 requêtes/mois)
 * GET /api/v9/flight?flight_iata=AF29&api_key=…
 * Réponse (défensive : le champ réel peut varier selon le plan) :
 *   response: { status, dep_iata, arr_iata, dep_time_utc, arr_time_utc,
 *               dep_estimated*, arr_estimated*, … }
 * Heures UTC au format « 2026-10-10 02:55 » → on parse en UTC systématique.
 * ───────────────────────────────────────────────────────────────────────── */

function parseUtcLoose(value?: string | null): Date | null {
  if (!value) return null;
  const iso = value.trim().replace(' ', 'T');
  const withZone = /[Z+]/.test(iso.slice(10)) ? iso : `${iso}Z`;
  const d = new Date(withZone);
  return Number.isNaN(d.getTime()) ? null : d;
}

interface AirLabsFlightResponse {
  response?: {
    status?: string;
    dep_iata?: string;
    arr_iata?: string;
    dep_time?: string;
    arr_time?: string;
    dep_time_utc?: string;
    arr_time_utc?: string;
    dep_estimated?: string;
    arr_estimated?: string;
    dep_estimated_utc?: string;
    arr_estimated_utc?: string;
    dep_actual_utc?: string;
    arr_actual_utc?: string;
  };
  error?: { code?: string; message?: string };
}

function pickAirLabsTimes(r: NonNullable<AirLabsFlightResponse['response']>): FlightStatusInfo | null {
  // Priorité : actual > estimated > scheduled (UTC d'abord, sinon local traité UTC)
  const depActual = parseUtcLoose(r.dep_actual_utc) ?? parseUtcLoose(r.dep_time_utc);
  const depEstimated = parseUtcLoose(r.dep_estimated_utc) ?? parseUtcLoose(r.dep_estimated);
  const depScheduled = parseUtcLoose(r.dep_time_utc) ?? parseUtcLoose(r.dep_time);
  const arrActual = parseUtcLoose(r.arr_actual_utc) ?? parseUtcLoose(r.arr_time_utc);
  const arrEstimated = parseUtcLoose(r.arr_estimated_utc) ?? parseUtcLoose(r.arr_estimated);
  const arrScheduled = parseUtcLoose(r.arr_time_utc) ?? parseUtcLoose(r.arr_time);

  const status = (r.status || '').toLowerCase();
  // « landed » → arr_time est l'heure réelle constatée chez AirLabs
  const arrival = arrActual ?? arrEstimated ?? arrScheduled;
  const departure = depActual ?? depEstimated ?? depScheduled;
  if (!arrival && !departure) return null;

  return {
    departureAt: departure,
    arrivalAt: arrival,
    departureIata: r.dep_iata,
    arrivalIata: r.arr_iata,
    departureSource: depActual
      ? 'actual'
      : depEstimated
        ? 'estimated'
        : depScheduled
          ? status === 'scheduled'
            ? 'scheduled'
            : 'estimated'
          : 'none',
    arrivalSource: arrActual || status === 'landed'
      ? 'actual'
      : arrEstimated
        ? 'estimated'
        : arrScheduled
          ? 'scheduled'
          : 'none',
  };
}

let airLabsWarnedAt = 0;
async function airLabsGetFlightStatus(
  carrier: string,
  number: string,
  _dateISO: string // AirLabs suit le vol en cours par numéro — la date sert au cache cron
): Promise<FlightStatusInfo | null> {
  const key = process.env.AIRLABS_API_KEY!;
  const attempt = async (iata: string): Promise<FlightStatusInfo | null> => {
    const url = `https://airlabs.co/api/v9/flight?flight_iata=${encodeURIComponent(iata)}&api_key=${encodeURIComponent(key)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000), cache: 'no-store' });
    if (!res.ok) {
      if (Date.now() - airLabsWarnedAt > 3600_000) {
        console.warn(`[AirLabs] flight ${iata} → HTTP ${res.status}`);
        airLabsWarnedAt = Date.now();
      }
      return null;
    }
    const json = (await res.json()) as AirLabsFlightResponse;
    if (json.error) {
      if (Date.now() - airLabsWarnedAt > 3600_000) {
        console.warn(`[AirLabs] erreur API: ${json.error.code} ${json.error.message}`);
        airLabsWarnedAt = Date.now();
      }
      return null;
    }
    return json.response ? pickAirLabsTimes(json.response) : null;
  };

  try {
    // IATA sans zéro initial (AF29), retry avec (AF029) si vide
    let info = await attempt(`${carrier}${number.replace(/^0+/, '') || number}`);
    if (!info) info = await attempt(`${carrier}${number}`);
    return info;
  } catch (e) {
    if (Date.now() - airLabsWarnedAt > 3600_000) {
      console.warn('[AirLabs] échec (non bloquant):', e instanceof Error ? e.message : e);
      airLabsWarnedAt = Date.now();
    }
    return null;
  }
}

/* ─── Dispatch vers le fournisseur actif ─── */
export async function getFlightStatus(
  carrierCode: string,
  flightNumber: string,
  scheduledDepartureDate: string
): Promise<FlightStatusInfo | null> {
  switch (currentProvider()) {
    case 'airlabs':
      return airLabsGetFlightStatus(carrierCode, flightNumber, scheduledDepartureDate);
    case 'amadeus':
      return amadeusGetFlightStatus(carrierCode, flightNumber, scheduledDepartureDate);
    default:
      return null;
  }
}
