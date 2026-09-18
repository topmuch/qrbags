import { db } from '@/lib/db';
import { runSchemaRepair } from './db-selfheal';

/* ══════════════════════════════════════════════════════════════
   Garde-fou spécifique Checklist — auto-réparation du schéma SQLite
   En production (Coolify), la base persistante peut être plus ancienne
   que le code déployé : si `prisma db push` a échoué silencieusement
   au boot (start.sh : 2>/dev/null || true), chaque create/select sur
   les colonnes récentes (airline, flightNumber, photoData…) échoue
   avec « no such column » → « Erreur serveur » côté utilisateur.
   → On détecte la dérive de schéma, on lance la réparation SQL
     (db-selfheal) puis on retente l'opération UNE fois.
   Idempotent, max 1 réparation / 10 s (anti-tempête).
   ══════════════════════════════════════════════════════════════ */

let lastRepairAt = 0;

const SCHEMA_DRIFT_PATTERN =
  /no such column|no column named|no such table|does not exist in the current database|Unknown column|P2021|P2022/i;

export function isChecklistSchemaDrift(error: unknown): boolean {
  const msg = error instanceof Error ? `${error.message}` : String(error);
  return SCHEMA_DRIFT_PATTERN.test(msg);
}

/**
 * Exécute `op` ; si elle échoue sur une dérive de schéma SQLite
 * (colonne/table manquante), répare le schéma puis retente une fois.
 */
export async function withChecklistSchemaRepair<T>(op: () => Promise<T>): Promise<T> {
  try {
    return await op();
  } catch (error) {
    if (!isChecklistSchemaDrift(error)) throw error;

    const now = Date.now();
    if (now - lastRepairAt < 10_000) throw error;
    lastRepairAt = now;

    const msg = error instanceof Error ? error.message : String(error);
    console.error('[checklist-repair] dérive de schéma détectée — réparation auto:', msg.slice(0, 180));
    try {
      const report = await runSchemaRepair();
      console.log(
        `[checklist-repair] réparation terminée: +${report.columnsAdded.length} colonne(s), ` +
        `${report.tablesCreated.length} table(s) créée(s)`
      );
    } catch (repairErr) {
      console.error('[checklist-repair] échec de la réparation:', repairErr instanceof Error ? repairErr.message : repairErr);
      throw error; // renvoyer l'erreur d'origine, pas celle de la réparation
    }
    return op();
  }
}
