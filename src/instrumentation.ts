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
  }
}
