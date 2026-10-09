/* ─────────────────────────────────────────────────────────────────────────
 * ⏰ FLIGHT-CRON — planificateur des notifications de vol QRBags
 *
 * Déclenche POST /api/cron/flight-arrivals toutes les 10 minutes :
 *   ✈️ « Bon vol ! »            (T-2h avant décollage)
 *   🛬 « Bienvenue à destination ! » (atterrissage réel Amadeus + 15 min)
 *
 * Service indépendant (port 3040) — l'app Next.js reste le seul à parler
 * à Amadeus/OneSignal/DB ; ce service ne fait que « sonner le réveil ».
 * ───────────────────────────────────────────────────────────────────────── */

const PORT = 3040;
const APP_URL = process.env.QRBAGS_URL || 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET || 'qrbags-cron-local-2026';
const INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

let running = false;

async function triggerFlightCron(reason: string): Promise<void> {
  if (running) return;
  running = true;
  try {
    const res = await fetch(`${APP_URL}/api/cron/flight-arrivals`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
      signal: AbortSignal.timeout(60_000),
    });
    const json = await res.json().catch(() => ({}));
    console.log(
      `[flight-cron] ${reason} → HTTP ${res.status}`,
      JSON.stringify(json).slice(0, 300)
    );
  } catch (e) {
    console.warn(
      `[flight-cron] ${reason} → échec (non bloquant):`,
      e instanceof Error ? e.message : e
    );
  } finally {
    running = false;
  }
}

// Petit serveur de santé (permet de vérifier que le service tourne)
Bun.serve({
  port: PORT,
  fetch: () =>
    new Response(
      JSON.stringify({
        service: 'flight-cron',
        status: 'ok',
        intervalMs: INTERVAL_MS,
        target: `${APP_URL}/api/cron/flight-arrivals`,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    ),
});
console.log(`⏰ [flight-cron] démarré — port ${PORT}, cycle ${INTERVAL_MS / 1000}s → ${APP_URL}`);

// Premier cycle immédiat, puis toutes les 10 minutes
triggerFlightCron('boot');
setInterval(() => triggerFlightCron('tick'), INTERVAL_MS);
