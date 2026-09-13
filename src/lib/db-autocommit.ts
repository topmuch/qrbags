/**
 * Auto-persistance DB — timer lancé par src/instrumentation.ts.
 *
 * Contexte : la plateforme restore le workspace via git entre les sessions,
 * ce qui efface toute écriture SQLite postérieure au dernier commit.
 * Ce module exécute scripts/db-autocommit-once.sh (commit + push de
 * db/custom.db) toutes les DB_AUTOCOMMIT_INTERVAL_MS millisecondes.
 * Le process next-server est supervisé par la plateforme → le timer survit.
 *
 * NB robustesse : chemin ABSOLU de bash et du script + env PATH garanti
 * (le spawn depuis next-server peut hériter d'un PATH restreint sans /bin
 * → "spawn bash ENOENT" constaté en production).
 */

const PROJECT_ROOT = '/home/z/my-project';
const INTERVAL_MS = Number(process.env.DB_AUTOCOMMIT_INTERVAL_MS || 60000);
const FIRST_RUN_MS = 15000; // première passe peu après le boot

let started = false;
let running = false;

async function runOnce(): Promise<void> {
  if (running) return;
  running = true;
  try {
    const { execFile } = await import('child_process');
    const { safeEnv } = await import('./db-selfheal');
    await new Promise<void>((resolve) => {
      execFile(
        '/bin/bash',
        [`${PROJECT_ROOT}/scripts/db-autocommit-once.sh`],
        { cwd: PROJECT_ROOT, timeout: 30000, env: safeEnv() },
        (error, stdout, stderr) => {
          const out = `${stdout || ''}${stderr || ''}`.trim();
          if (out) console.log(out);
          if (error && !out) console.error('[db-autocommit] erreur exec:', error.message);
          resolve(); // jamais de rejet : le timer doit survivre aux échecs git
        },
      );
    });
  } catch {
    // silence : ne jamais casser le serveur pour un snapshot
  } finally {
    running = false;
  }
}

export function startDbAutocommit(): void {
  if (started) return;
  started = true;
  console.log(`[db-autocommit] timer actif (intervalle ${INTERVAL_MS}ms, 1re passe dans ${FIRST_RUN_MS}ms)`);
  setTimeout(runOnce, FIRST_RUN_MS).unref?.();
  setInterval(runOnce, INTERVAL_MS).unref?.();
}
