/**
 * Auto-persistance DB — timer lancé par src/instrumentation.ts.
 *
 * Contexte : la plateforme restore le workspace via git entre les sessions,
 * ce qui efface toute écriture SQLite postérieure au dernier commit.
 * Ce module exécute scripts/db-autocommit-once.sh (commit + push de
 * db/custom.db) toutes les DB_AUTOCOMMIT_INTERVAL_MS millisecondes.
 * Le process next-server est supervisé par la plateforme → le timer survit.
 */

const INTERVAL_MS = Number(process.env.DB_AUTOCOMMIT_INTERVAL_MS || 60000);
const FIRST_RUN_MS = 15000; // première passe peu après le boot

let started = false;
let running = false;

async function runOnce(): Promise<void> {
  if (running) return;
  running = true;
  try {
    const { execFile } = await import('child_process');
    await new Promise<void>((resolve) => {
      execFile(
        'bash',
        ['scripts/db-autocommit-once.sh'],
        { cwd: process.cwd(), timeout: 30000 },
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
