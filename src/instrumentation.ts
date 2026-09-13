/**
 * Hook instrumentation Next.js — appelé une fois au boot du serveur (dev + prod).
 * Lance l'auto-persistance de la DB (commit + push périodique) : sans cela,
 * le restore workspace de la plateforme efface les données utilisateur
 * écrites après le dernier commit (bug "dashboard agence vide" + "export ZIP").
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startDbAutocommit } = await import('./lib/db-autocommit');
    startDbAutocommit();
  }
}
