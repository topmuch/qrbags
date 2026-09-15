import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { EXPECTED_SCHEMA, getLastRepairReport, runSchemaRepair } from '@/lib/db-selfheal';

export const dynamic = 'force-dynamic';

/**
 * GET /api/system/health — diagnostic public (aucune donnée sensible).
 *
 * Vérifie :
 * 1. La connectivité de la base de données
 * 2. L'intégrité du schéma (tables + colonnes attendues)
 * 3. Le rapport de la dernière réparation selfheal
 *
 * Utilisé après déploiement pour confirmer que la base production
 * (6840 bagages) est de nouveau lisible par les pages QR codes.
 * La réparation complète tourne au boot via src/instrumentation.ts ;
 * on la relance ici uniquement si le schéma est détecté incomplet.
 */
export async function GET() {
  const startedAt = Date.now();
  try {
    // 1) Connectivité
    await db.$queryRawUnsafe(`SELECT 1`);

    // 2) Intégrité du schéma (lecture seule)
    const existingTables = (
      (await db.$queryRawUnsafe<Array<{ name: string }>>(
        `SELECT name FROM sqlite_master WHERE type='table'`,
      )) as Array<{ name: string }>
    ).map((t) => t.name);
    const tableSet = new Set(existingTables);

    let missingTables = 0;
    let missingColumns = 0;
    const details: Array<{ table: string; missing: string[] }> = [];

    for (const [tableName, columns] of Object.entries(EXPECTED_SCHEMA)) {
      if (!tableSet.has(tableName)) {
        missingTables++;
        details.push({ table: tableName, missing: ['__TABLE__'] });
        continue;
      }
      const actual = (
        (await db.$queryRawUnsafe<Array<{ name: string }>>(
          `PRAGMA table_info("${tableName}")`,
        )) as Array<{ name: string }>
      ).map((c) => c.name);
      const colSet = new Set(actual);
      const missing = columns.filter((c) => !colSet.has(c.name)).map((c) => c.name);
      if (missing.length > 0) {
        missingColumns += missing.length;
        details.push({ table: tableName, missing: missing.slice(0, 12) });
      }
    }

    const schemaOk = missingTables === 0 && missingColumns === 0;

    // 3) Si schéma incomplet → réparation immédiate (additive, sans perte)
    let repaired: { tablesCreated: string[]; columnsAdded: number; errors: string[] } | null = null;
    if (!schemaOk) {
      const report = await runSchemaRepair();
      repaired = {
        tablesCreated: report.tablesCreated,
        columnsAdded: report.columnsAdded.length,
        errors: report.errors,
      };
    }

    const lastReport = getLastRepairReport();

    // Test lecture réel (celui qui échouait en production)
    let baggageReadOk = false;
    try {
      await db.baggage.findFirst({ select: { id: true, reference: true } });
      baggageReadOk = true;
    } catch {
      baggageReadOk = false;
    }

    return NextResponse.json(
      {
        status: baggageReadOk && schemaOk ? 'ok' : 'degraded',
        database: 'connected',
        schema: {
          ok: schemaOk,
          missingTables,
          missingColumns,
          details: details.slice(0, 10),
        },
        baggageReadOk,
        selfheal: {
          bootReport: lastReport
            ? {
                tablesCreated: lastReport.tablesCreated,
                columnsAdded: lastReport.columnsAdded.length,
                errors: lastReport.errors.slice(0, 5),
                durationMs: lastReport.durationMs,
              }
            : null,
          repairedNow: repaired,
        },
        durationMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        database: 'unreachable',
        error: error instanceof Error ? error.message.slice(0, 200) : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
