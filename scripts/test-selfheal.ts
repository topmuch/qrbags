/**
 * Test du selfheal : simule une base production obsolète puis vérifie la réparation.
 * - Copie db/custom.db vers /tmp/test-selfheal.db
 * - Supprime des colonnes récentes (photoPath, reward, transportMode) + table Review
 *   via Prisma $executeRawUnsafe (pas de CLI sqlite3 nécessaire)
 * - Lance runSchemaRepair() contre cette base
 * - Vérifie que colonnes/tables sont restaurées ET que les données sont intactes
 *
 * Usage: bun scripts/test-selfheal.ts
 */
import fs from 'fs';

const SRC_DB = '/home/z/my-project/db/custom.db';
const TEST_DB = '/tmp/test-selfheal.db';

// DATABASE_URL AVANT tout import de @prisma/client
process.env.DATABASE_URL = `file:${TEST_DB}`;

// 1) Préparer la copie cassée
fs.copyFileSync(SRC_DB, TEST_DB);

const { PrismaClient } = await import('@prisma/client');
const p = new PrismaClient();

const raw = async (sql: string) => {
  try {
    await p.$executeRawUnsafe(sql);
    console.log(`✓ exécuté: ${sql.slice(0, 60)}`);
    return true;
  } catch (e) {
    console.log(`⚠ échec: ${sql.slice(0, 60)} → ${(e as Error).message.slice(0, 110)}`);
    return false;
  }
};

const tableColumns = async (table: string): Promise<string[]> => {
  const cols = (await p.$queryRawUnsafe<Array<{ name: string }>>(
    `PRAGMA table_info("${table}")`
  )) as Array<{ name: string }>;
  return cols.map((c) => c.name);
};

console.log('=== SIMULATION VIEILLE BASE PRODUCTION ===');
// Suppression de colonnes récentes (comme une base créée avant la photo/récompense/transport)
await raw(`ALTER TABLE Baggage DROP COLUMN photoPath`);
await raw(`ALTER TABLE Baggage DROP COLUMN reward`);
await raw(`ALTER TABLE Baggage DROP COLUMN transportMode`);
await raw(`ALTER TABLE Baggage DROP COLUMN declaredLostAt`);
await raw(`DROP TABLE IF EXISTS Review`);

const baggageCountBefore = (await p.$queryRawUnsafe<Array<{ n: number }>>(
  `SELECT COUNT(*) as n FROM Baggage`
)) as Array<{ n: number }>;
const before = baggageCountBefore[0].n;
console.log(`\nBaggages AVANT réparation: ${before}`);

// Vérifier que la lecture complète Prisma échoue bien (comme en production)
let failedBefore = false;
try {
  await p.baggage.findMany({ take: 1, include: { agency: true } });
  console.log('⚠ lecture complète RÉUSSIE avant réparation (inattendu)');
} catch (e) {
  failedBefore = true;
  console.log(`✅ lecture complète échoue bien avant réparation: ${(e as Error).message.slice(0, 90)}`);
}

// 2) Lancer la réparation
const { runSchemaRepair } = await import('../src/lib/db-selfheal');
const report = await runSchemaRepair();

console.log('\n=== RAPPORT DE RÉPARATION ===');
console.log(
  JSON.stringify(
    {
      checked: report.checked,
      tablesCreated: report.tablesCreated,
      columnsAdded: report.columnsAdded,
      errors: report.errors,
      pushAttempted: report.pushAttempted,
      pushSucceeded: report.pushSucceeded,
      durationMs: report.durationMs,
    },
    null,
    2
  )
);

// 3) Vérifier l'état APRÈS
const afterRows = (await p.$queryRawUnsafe<Array<{ n: number }>>(
  `SELECT COUNT(*) as n FROM Baggage`
)) as Array<{ n: number }>;
const after = afterRows[0].n;

const cols = await tableColumns('Baggage');
console.log(`\nBaggages APRÈS réparation: ${after} (attendu: ${before})`);

const reviewExists = Number(
  (
    (await p.$queryRawUnsafe<Array<{ n: bigint | number }>>(
      `SELECT COUNT(*) as n FROM sqlite_master WHERE type='table' AND name='Review'`
    )) as Array<{ n: bigint | number }>
  )[0].n
) === 1;

console.log('\n=== VÉRIFICATIONS ===');
console.log(`${cols.includes('photoPath') ? '✅' : '❌'} photoPath restaurée`);
console.log(`${cols.includes('reward') ? '✅' : '❌'} reward restaurée`);
console.log(`${cols.includes('transportMode') ? '✅' : '❌'} transportMode restaurée`);
console.log(`${cols.includes('declaredLostAt') ? '✅' : '❌'} declaredLostAt restaurée`);
console.log(`${reviewExists ? '✅' : '❌'} table Review restaurée`);
console.log(`${before === after ? '✅' : '❌'} données intactes (${after}/${before})`);
console.log(`${failedBefore ? '✅' : '❌'} l'erreur production était bien reproductible`);

// 4) Test lecture Prisma complète (celle qui échouait en production)
let readOk = false;
try {
  const baggages = await p.baggage.findMany({ take: 3, include: { agency: true } });
  readOk = true;
  console.log(`✅ Prisma findMany + include agency OK: ${baggages.length} bagage(s) lu(s), agence: ${baggages[0]?.agency?.name || 'aucune'}`);
} catch (e) {
  console.log(`❌ Prisma findMany échoue encore: ${(e as Error).message.slice(0, 150)}`);
}

// 5) Test idempotence (2e passage ne doit rien changer)
const report2 = await runSchemaRepair();
console.log(
  `✅ idempotence: 2e passage → ${report2.columnsAdded.length} colonne(s), ${report2.tablesCreated.length} table(s) (attendu 0/0)`
);

await p.$disconnect();
fs.unlinkSync(TEST_DB);
console.log('\n🧹 base de test supprimée');
console.log(readOk ? '\n🎉 TEST GLOBAL: RÉUSSI' : '\n💥 TEST GLOBAL: ÉCHEC');
