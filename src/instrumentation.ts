/**
 * Hook instrumentation Next.js — appelé une fois au boot du serveur (dev + prod).
 *
 * Lance le garde-fou db-selfheal :
 * vérifie le schéma SQLite réel (PRAGMA / sqlite_master) et répare
 * additivement ce qui manque (colonnes via ALTER TABLE, tables via CREATE
 * TABLE IF NOT EXISTS, puis `prisma db push` si dispo).
 *
 * Sans cela, une base de production créée par une version antérieure du
 * schéma fait échouer toutes les lectures complètes de Baggage (P2022) :
 * les QR codes existent dans la base mais plus aucune liste ne s'affiche.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startDbSelfheal } = await import('./lib/db-selfheal');
    startDbSelfheal();

    // 💾 Backup automatique quotidien au boot (fire-and-forget, jamais bloquant)
    if (process.env.DISABLE_AUTO_BACKUP !== '1') {
      setTimeout(async () => {
        try {
          const { backupIfNeededOncePerDay } = await import('./lib/backup');
          await backupIfNeededOncePerDay('boot');
        } catch (error) {
          console.error('[backup] Erreur au boot :', error);
        }
      }, 10_000); // 10 s après le boot pour laisser Prisma/DB se stabiliser
    }

    // ✈️ E-mails post-voyage (48 h après le départ) — horloge interne :
    // un passage au boot + toutes les 30 min. Fire-and-forget, jamais bloquant.
    // Anti-doublon garanti par Baggage.postTripEmailSentAt côté lib/post-trip.
    // Un cron externe (/api/cron/post-trip) existe aussi en secours.
    if (process.env.DISABLE_POST_TRIP_CRON !== '1') {
      const runPostTrip = async (trigger: string) => {
        try {
          const { sendPostTripEmails } = await import('./lib/post-trip');
          const r = await sendPostTripEmails(20);
          if (r.sent > 0) {
            console.log(`[post-trip] ${r.sent} e-mail(s) envoyé(s) (trigger: ${trigger})`);
          }
        } catch (error) {
          console.error(`[post-trip] Erreur (trigger: ${trigger}) :`, error);
        }
      };
      setTimeout(() => void runPostTrip('boot'), 20_000); // 20 s après le boot
      const postTripInterval = setInterval(() => void runPostTrip('interval'), 30 * 60 * 1000);
      if (typeof postTripInterval.unref === 'function') postTripInterval.unref();
    }
  }
}
