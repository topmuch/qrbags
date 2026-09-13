/**
 * Auto-réparation du schéma DB — appelé par src/instrumentation.ts.
 *
 * Contexte : le restore workspace de la plateforme peut remplacer db/custom.db
 * par une version ANCIENNE (schéma périmé) → Prisma échoue avec P2022
 * ("The column main.Baggage.photoPath does not exist").
 * Ce module vérifie le schéma réel (PRAGMA) et lance `prisma db push` si des
 * colonnes attendues manquent — opération additive, sans perte de données.
 * Vérification au boot PUIS périodique (le restore peut survenir en cours de
 * session sans redémarrage du serveur).
 */

const PROJECT_ROOT = '/home/z/my-project';
const REQUIRED_COLUMNS: Array<{ table: string; column: string }> = [
  { table: 'Baggage', column: 'photoPath' },
  { table: 'Baggage', column: 'reward' },
  { table: 'Baggage', column: 'airlineName' },
  { table: 'Baggage', column: 'flightNumber' },
  { table: 'Baggage', column: 'setId' },
];
const BOOT_DELAY_MS = 8000;
const CHECK_INTERVAL_MS = Number(process.env.DB_SELFHEAL_INTERVAL_MS || 300000); // 5 min

/** Environnement garanti pour les processus enfants (PATH/HOME complets). */
export function safeEnv(): NodeJS.ProcessEnv {
  return {
    ...process.env,
    PATH: `/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:${process.env.PATH || ''}`,
    HOME: process.env.HOME || '/home/z',
  };
}

let healing = false;

async function runDbPush(reason: string): Promise<void> {
  if (healing) return;
  healing = true;
  try {
    console.warn(`[db-selfheal] schéma obsolète détecté (${reason}) → prisma db push…`);
    const { execFile } = await import('child_process');
    await new Promise<void>((resolve) => {
      execFile(
        '/bin/bash',
        ['-c', `cd ${PROJECT_ROOT} && ./node_modules/.bin/prisma db push --skip-generate 2>&1 | tail -5`],
        { cwd: PROJECT_ROOT, timeout: 120000, env: safeEnv() },
        (error, stdout, stderr) => {
          const out = `${stdout || ''}${stderr || ''}`.trim();
          if (out) console.log(`[db-selfheal] prisma db push:\n${out}`);
          console.log(`[db-selfheal] db push terminé${error ? ' (avec erreur, réessai au prochain cycle)' : ''}`);
          resolve();
        },
      );
    });
  } catch {
    // ne jamais casser le serveur
  } finally {
    healing = false;
  }
}

async function checkOnce(): Promise<void> {
  try {
    const { db } = await import('./db');
    for (const { table, column } of REQUIRED_COLUMNS) {
      const cols = (await db.$queryRawUnsafe<Array<{ name: string }>>(
        `PRAGMA table_info(${table})`,
      )) as Array<{ name: string }>;
      if (!cols.some((c) => c.name === column)) {
        await runDbPush(`${table}.${column} absente — ${cols.length} colonnes trouvées`);
        return;
      }
    }
  } catch (e) {
    // DB injoignable : log discret, réessai au prochain cycle
    console.warn('[db-selfheal] vérification impossible:', e instanceof Error ? e.message.slice(0, 120) : e);
  }
}

export function startDbSelfheal(): void {
  setTimeout(() => { void checkOnce(); }, BOOT_DELAY_MS).unref?.();
  setInterval(() => { void checkOnce(); }, CHECK_INTERVAL_MS).unref?.();
  console.log(`[db-selfheal] actif (boot +8s, puis toutes les ${CHECK_INTERVAL_MS / 1000}s)`);
}
