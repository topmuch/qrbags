/**
 * Hook instrumentation Next.js — appelé une fois au boot du serveur (dev + prod).
 *
 * Lance deux garde-fous contre les restores workspace de la plateforme :
 * 1. db-autocommit  : commit + push périodique de db/custom.db (60 s)
 * 2. db-selfheal    : vérifie le schéma SQLite et lance `prisma db push`
 *                     si une colonne attendue manque (erreur P2022 constatée
 *                     quand un restore ramène une vieille version de la DB)
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startDbAutocommit } = await import('./lib/db-autocommit');
    startDbAutocommit();
    const { startDbSelfheal } = await import('./lib/db-selfheal');
    startDbSelfheal();
  }
}
