/**
 * Auto-réparation du schéma SQLite — filet de sécurité production.
 *
 * PROBLÈME RÉSOLU (production qrbags.com, septembre 2026) :
 * le conteneur Docker démarre avec une base SQLite créée par une version
 * antérieure du schéma Prisma (le volume /app/data persiste, mais
 * `prisma db push` n'a pas tourné). Toute requête Prisma qui lit toutes
 * les colonnes échoue alors avec P2022 ("The column X does not exist") :
 *   - GET /api/qrcodes          → 500  (page admin "QR Codes Générés" vide)
 *   - GET /api/agency/baggages  → 500  (espace agence vide)
 *   - GET /api/suivi/[ref]      → 500
 *   - GET /api/admin/voyageurs  → 500
 * alors que les agrégats (count) fonctionnent → le dashboard affiche
 * encore "6840 QR codes" mais plus aucune liste ne s'affiche.
 *   ⚠️ Symptôme utilisateur : « les bagages ont disparu » — les QR existent
 *   toujours en base, seule la LISTE échoue (les counts restent OK).
 *
 * SOLUTION (100 % additive, sans perte de données) :
 * 0. Schéma attendu dérivé DYNAMIQUEMENT du DMMF du client Prisma généré
 *    (@prisma/client) — impossible d'oublier une colonne lors d'une future
 *    migration (ex: travelerEmail oublié en sept. 2026 → P2022 récidive).
 *    Le miroir statique ci-dessous reste en secours si le DMMF est
 *    indisponible. Fusion statique + dynamique.
 * 1. Tables manquantes   → CREATE TABLE IF NOT EXISTS (définitions alignées
 *    sur prisma/schema.prisma, sans FK/index — les requêtes Prisma
 *    fonctionnent sans ; `prisma db push` les réconcilie ensuite)
 * 2. Colonnes manquantes → PRAGMA table_info + ALTER TABLE ADD COLUMN
 * 3. Réconciliation complète → `npx prisma db push --skip-generate`
 *    si le CLI est disponible (image Docker fixée ≥ 74685fd), non bloquant.
 *
 * Appelé par src/instrumentation.ts : au boot (+5 s) puis toutes les 5 min.
 * Idempotent : ne modifie QUE ce qui manque, ne touche jamais aux données.
 */

const CHECK_INTERVAL_MS = Number(process.env.DB_SELFHEAL_INTERVAL_MS || 300000); // 5 min
const BOOT_DELAY_MS = 5000;

interface ColumnDef {
  /** Fragment DDL complet, ex: `"photoPath" TEXT` */
  ddl: string;
  /** Nom de la colonne */
  name: string;
}

/** Colonnes NOT NULL sans DEFAULT : uniquement présentes dès la création de
 *  la table (ALTER impossible sur table non vide — géré par CREATE TABLE). */
function table(name: string, columns: ColumnDef[]): [string, ColumnDef[]] {
  return [name, columns];
}

const C = (ddl: string): ColumnDef => ({
  name: ddl.match(/"([^"]+)"/)?.[1] || ddl,
  ddl,
});

const CREATED_AT = C('"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');
const UPDATED_AT = C('"updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');

/**
 * Mapping type Prisma → type SQLite (aligné sur ce que `prisma db push`
 * crée pour SQLite, à l'exception de Json → TEXT, plus sûr en ALTER).
 */
function prismaTypeToSqlite(type: string): string | null {
  switch (type) {
    case 'String': return 'TEXT';
    case 'Boolean': return 'BOOLEAN';
    case 'Int': return 'INTEGER';
    case 'BigInt': return 'INTEGER';
    case 'Float': return 'REAL';
    case 'Decimal': return 'DECIMAL';
    case 'DateTime': return 'DATETIME';
    case 'Json': return 'TEXT';
    case 'Bytes': return 'BLOB';
    default: return null; // Unsupported / enums sans mapping → ignoré
  }
}

/**
 * Construit le schéma attendu depuis le DMMF du client Prisma généré.
 * Retourne null si le DMMF est indisponible (fallback sur le miroir statique).
 */
export function buildSchemaFromDmmf(): Record<string, ColumnDef[]> | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Prisma } = require('@prisma/client') as typeof import('@prisma/client');
    if (!Prisma?.dmmf?.datamodel?.models?.length) return null;

    const result: Record<string, ColumnDef[]> = {};
    for (const model of Prisma.dmmf.datamodel.models) {
      const columns: ColumnDef[] = [];
      for (const field of model.fields) {
        if (field.kind !== 'scalar') continue; // relations / objets ignorés
        const sqliteType = prismaTypeToSqlite(field.type);
        if (!sqliteType) continue;

        const isId = field.isId;
        const required = field.isRequired;

        // Colonnes NOT NULL sans DEFAULT : uniquement créables à la création
        // de table (ALTER impossible sur table non vide) — en ALTER on les
        // ajoute NULLABLE pour ne jamais bloquer.
        if (isId) {
          columns.push(C(`"${field.name}" TEXT NOT NULL PRIMARY KEY`));
          continue;
        }

        let ddl = `"${field.name}" ${sqliteType}`;
        if (required) {
          const def = field.default;
          if (def === undefined || def === null) {
            // required sans default → nullable en ALTER, NOT NULL en création
            // est géré par la définition statique / prisma db push.
            columns.push({ name: field.name, ddl });
            continue;
          }
          const sqlDefault = formatPrismaDefault(def);
          if (sqlDefault === null) {
            columns.push({ name: field.name, ddl });
            continue;
          }
          ddl += ` NOT NULL DEFAULT ${sqlDefault}`;
        }
        columns.push(C(ddl));
      }
      if (columns.length > 0) result[model.name] = columns;
    }
    return Object.keys(result).length > 0 ? result : null;
  } catch {
    return null;
  }
}

/** Convertit la valeur @default du DMMF en fragment SQL SQLite (ou null). */
function formatPrismaDefault(def: unknown): string | null {
  if (typeof def === 'string') return `'${def.replace(/'/g, "''")}'`;
  if (typeof def === 'number') return String(def);
  if (typeof def === 'boolean') return def ? 'true' : 'false';
  if (typeof def === 'object' && def !== null) {
    const name = (def as { name?: string }).name;
    if (name === 'now') return 'CURRENT_TIMESTAMP';
    // autoincrement / cuid / uuid / dbgenerated → pas de DEFAULT SQL exploitable
    return null;
  }
  return null;
}

/**
 * Schéma attendu FINAL = miroir statique (secours) fusionné avec le schéma
 * dynamique dérivé du DMMF (source de vérité, toujours à jour).
 */
export function buildMergedSchema(): Record<string, ColumnDef[]> {
  const merged: Record<string, ColumnDef[]> = {};

  // 1) Base statique (secours — couvre les cas où le DMMF est indisponible)
  for (const [tableName, columns] of Object.entries(STATIC_FALLBACK_SCHEMA)) {
    merged[tableName] = [...columns];
  }

  // 2) Fusion dynamique — complète/corrige avec le vrai schéma Prisma
  const dynamic = buildSchemaFromDmmf();
  if (dynamic) {
    for (const [tableName, columns] of Object.entries(dynamic)) {
      if (!merged[tableName]) {
        merged[tableName] = columns;
        continue;
      }
      const seen = new Set(merged[tableName].map((c) => c.name));
      for (const col of columns) {
        if (!seen.has(col.name)) merged[tableName].push(col);
      }
    }
  }

  return merged;
}

/** Schéma attendu — miroir statique de prisma/schema.prisma (SECOURS).
 *  ⚠️ Ne plus ajouter manuellement ici : le DMMF dérive tout automatiquement.
 *  Conservé uniquement si @prisma/client ne peut pas fournir son DMMF. */
const STATIC_FALLBACK_SCHEMA: Record<string, ColumnDef[]> = Object.fromEntries([
  table('User', [
    C('"id" TEXT NOT NULL PRIMARY KEY'),
    C('"email" TEXT NOT NULL'),
    C('"name" TEXT'),
    C('"password" TEXT'),
    C('"role" TEXT NOT NULL DEFAULT \'agency\''),
    C('"agencyId" TEXT'),
    CREATED_AT,
    UPDATED_AT,
  ]),
  table('Session', [
    C('"id" TEXT NOT NULL PRIMARY KEY'),
    C('"userId" TEXT NOT NULL'),
    C('"userAgent" TEXT'),
    C('"ipAddress" TEXT'),
    C('"lastActivity" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP'),
    C('"expiresAt" DATETIME NOT NULL'),
    CREATED_AT,
  ]),
  table('LoginLog', [
    C('"id" TEXT NOT NULL PRIMARY KEY'),
    C('"userId" TEXT'),
    C('"email" TEXT NOT NULL'),
    C('"success" BOOLEAN NOT NULL DEFAULT false'),
    C('"failureReason" TEXT'),
    C('"ipAddress" TEXT'),
    C('"userAgent" TEXT'),
    C('"country" TEXT'),
    C('"city" TEXT'),
    CREATED_AT,
  ]),
  table('Agency', [
    C('"id" TEXT NOT NULL PRIMARY KEY'),
    C('"name" TEXT NOT NULL'),
    C('"slug" TEXT NOT NULL'),
    C('"email" TEXT'),
    C('"phone" TEXT'),
    C('"address" TEXT'),
    C('"active" BOOLEAN NOT NULL DEFAULT true'),
    CREATED_AT,
  ]),
  table('Baggage', [
    C('"id" TEXT NOT NULL PRIMARY KEY'),
    C('"reference" TEXT NOT NULL'),
    C('"type" TEXT NOT NULL'),
    C('"setId" TEXT'),
    C('"agencyId" TEXT'),
    C('"travelerFirstName" TEXT'),
    C('"travelerLastName" TEXT'),
    C('"travelerEmail" TEXT'),
    C('"whatsappOwner" TEXT'),
    C('"baggageIndex" INTEGER NOT NULL DEFAULT 1'),
    C('"baggageType" TEXT NOT NULL DEFAULT \'cabine\''),
    C('"status" TEXT NOT NULL DEFAULT \'pending_activation\''),
    C('"transportMode" TEXT NOT NULL DEFAULT \'flight\''),
    C('"airlineName" TEXT'),
    C('"flightNumber" TEXT'),
    C('"trainCompany" TEXT'),
    C('"trainNumber" TEXT'),
    C('"shipName" TEXT'),
    C('"shipCabin" TEXT'),
    C('"busCompany" TEXT'),
    C('"busLineNumber" TEXT'),
    C('"destination" TEXT'),
    C('"departureDate" DATETIME'),
    C('"departureTime" TEXT'),
    CREATED_AT,
    C('"expiresAt" DATETIME'),
    C('"lastScanDate" DATETIME'),
    C('"lastLocation" TEXT'),
    C('"declaredLostAt" DATETIME'),
    C('"foundAt" DATETIME'),
    C('"founderName" TEXT'),
    C('"founderPhone" TEXT'),
    C('"founderAt" DATETIME'),
    C('"photoPath" TEXT'),
    C('"photoData" BLOB'),
    C('"photoMime" TEXT'),
    C('"photoSizeBytes" INTEGER'),
    C('"reward" TEXT'),
  ]),
  table('ScanLog', [
    C('"id" TEXT NOT NULL PRIMARY KEY'),
    C('"baggageId" TEXT NOT NULL'),
    C('"ipAddress" TEXT'),
    C('"country" TEXT'),
    C('"city" TEXT'),
    C('"latitude" REAL'),
    C('"longitude" REAL'),
    C('"location" TEXT'),
    C('"message" TEXT'),
    CREATED_AT,
    C('"whatsappStatus" TEXT'),
    C('"aiAnalysis" JSONB'),
    C('"groqUsed" BOOLEAN NOT NULL DEFAULT false'),
    C('"groqLatencyMs" INTEGER'),
    C('"aiMessageUsed" BOOLEAN NOT NULL DEFAULT false'),
    C('"groqModelUsed" TEXT'),
    C('"wakitMessageId" TEXT'),
    C('"context" TEXT'),
    C('"finderName" TEXT'),
    C('"finderPhone" TEXT'),
  ]),
  table('Setting', [
    C('"id" TEXT NOT NULL PRIMARY KEY'),
    C('"key" TEXT NOT NULL'),
    C('"value" TEXT NOT NULL'),
    UPDATED_AT,
  ]),
  table('Page', [
    C('"id" TEXT NOT NULL PRIMARY KEY'),
    C('"slug" TEXT NOT NULL'),
    C('"title" TEXT NOT NULL'),
    C('"content" TEXT NOT NULL'),
    C('"published" BOOLEAN NOT NULL DEFAULT false'),
    CREATED_AT,
    UPDATED_AT,
  ]),
  table('Banner', [
    C('"id" TEXT NOT NULL PRIMARY KEY'),
    C('"type" TEXT NOT NULL'),
    C('"content" TEXT NOT NULL'),
    C('"active" BOOLEAN NOT NULL DEFAULT true'),
    CREATED_AT,
    UPDATED_AT,
  ]),
  table('FeatureFlag', [
    C('"id" TEXT NOT NULL PRIMARY KEY'),
    C('"key" TEXT NOT NULL'),
    C('"label" TEXT NOT NULL'),
    C('"description" TEXT NOT NULL'),
    C('"category" TEXT NOT NULL DEFAULT \'general\''),
    C('"enabled" BOOLEAN NOT NULL DEFAULT false'),
    C('"icon" TEXT'),
    CREATED_AT,
    UPDATED_AT,
  ]),
  table('Message', [
    C('"id" TEXT NOT NULL PRIMARY KEY'),
    C('"type" TEXT NOT NULL'),
    C('"status" TEXT NOT NULL DEFAULT \'non_lu\''),
    C('"senderName" TEXT'),
    C('"senderEmail" TEXT'),
    C('"senderPhone" TEXT'),
    C('"agencyId" TEXT'),
    C('"recipientAgencyId" TEXT'),
    C('"subject" TEXT'),
    C('"content" TEXT NOT NULL'),
    CREATED_AT,
    UPDATED_AT,
  ]),
  table('Notification', [
    C('"id" TEXT NOT NULL PRIMARY KEY'),
    C('"type" TEXT NOT NULL'),
    C('"userId" TEXT'),
    C('"agencyId" TEXT'),
    C('"baggageId" TEXT'),
    C('"message" TEXT NOT NULL'),
    C('"data" TEXT'),
    C('"read" BOOLEAN NOT NULL DEFAULT false'),
    CREATED_AT,
    UPDATED_AT,
  ]),
  table('EmailSettings', [
    C('"id" TEXT NOT NULL PRIMARY KEY'),
    C('"provider" TEXT NOT NULL DEFAULT \'console\''),
    C('"fromEmail" TEXT NOT NULL DEFAULT \'noreply@qrbags.com\''),
    C('"fromName" TEXT NOT NULL DEFAULT \'QRBags\''),
    C('"recipientEmail" TEXT'),
    C('"smtpHost" TEXT'),
    C('"smtpPort" INTEGER'),
    C('"smtpUser" TEXT'),
    C('"smtpPassword" TEXT'),
    C('"smtpEncryption" TEXT NOT NULL DEFAULT \'tls\''),
    C('"isActive" BOOLEAN NOT NULL DEFAULT true'),
    C('"lastTestAt" DATETIME'),
    C('"lastTestStatus" TEXT'),
    C('"lastTestError" TEXT'),
    CREATED_AT,
    UPDATED_AT,
  ]),
  table('EmailLog', [
    C('"id" TEXT NOT NULL PRIMARY KEY'),
    C('"to" TEXT NOT NULL'),
    C('"subject" TEXT NOT NULL'),
    C('"type" TEXT NOT NULL'),
    C('"status" TEXT NOT NULL DEFAULT \'pending\''),
    C('"error" TEXT'),
    C('"userId" TEXT'),
    C('"agencyId" TEXT'),
    C('"data" TEXT'),
    C('"sentAt" DATETIME'),
    CREATED_AT,
  ]),
  table('EmailToken', [
    C('"id" TEXT NOT NULL PRIMARY KEY'),
    C('"email" TEXT NOT NULL'),
    C('"token" TEXT NOT NULL'),
    C('"type" TEXT NOT NULL'),
    C('"code" TEXT'),
    C('"expiresAt" DATETIME NOT NULL'),
    C('"used" BOOLEAN NOT NULL DEFAULT false'),
    C('"usedAt" DATETIME'),
    CREATED_AT,
  ]),
  table('Invoice', [
    C('"id" TEXT NOT NULL PRIMARY KEY'),
    C('"number" TEXT NOT NULL'),
    C('"agencyId" TEXT NOT NULL'),
    C('"amount" REAL NOT NULL'),
    C('"currency" TEXT NOT NULL DEFAULT \'EUR\''),
    C('"status" TEXT NOT NULL DEFAULT \'pending\''),
    C('"description" TEXT'),
    C('"items" TEXT NOT NULL'),
    C('"dueDate" DATETIME'),
    C('"paidAt" DATETIME'),
    C('"paymentMethod" TEXT'),
    CREATED_AT,
    UPDATED_AT,
  ]),
  table('Lead', [
    C('"id" TEXT NOT NULL PRIMARY KEY'),
    C('"name" TEXT NOT NULL'),
    C('"email" TEXT NOT NULL'),
    C('"phone" TEXT'),
    C('"company" TEXT'),
    C('"status" TEXT NOT NULL DEFAULT \'new\''),
    C('"source" TEXT'),
    C('"notes" TEXT'),
    C('"agencyId" TEXT'),
    C('"assignedToId" TEXT'),
    CREATED_AT,
    UPDATED_AT,
  ]),
  table('Observation', [
    C('"id" TEXT NOT NULL PRIMARY KEY'),
    C('"leadId" TEXT NOT NULL'),
    C('"type" TEXT NOT NULL'),
    C('"content" TEXT NOT NULL'),
    C('"date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP'),
    C('"userId" TEXT NOT NULL'),
    CREATED_AT,
  ]),
  table('DailyReport', [
    C('"id" TEXT NOT NULL PRIMARY KEY'),
    C('"userId" TEXT NOT NULL'),
    C('"date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP'),
    C('"content" TEXT NOT NULL'),
    CREATED_AT,
    UPDATED_AT,
  ]),
  table('Advertisement', [
    C('"id" TEXT NOT NULL PRIMARY KEY'),
    C('"title" TEXT NOT NULL'),
    C('"description" TEXT'),
    C('"imageUrl" TEXT NOT NULL'),
    C('"linkUrl" TEXT'),
    C('"linkTarget" TEXT NOT NULL DEFAULT \'_blank\''),
    C('"position" TEXT NOT NULL DEFAULT \'footer\''),
    C('"targetScope" TEXT NOT NULL DEFAULT \'all\''),
    C('"agencyId" TEXT'),
    C('"startDate" DATETIME NOT NULL'),
    C('"endDate" DATETIME'),
    C('"status" TEXT NOT NULL DEFAULT \'draft\''),
    C('"priority" INTEGER NOT NULL DEFAULT 0'),
    C('"impressions" INTEGER NOT NULL DEFAULT 0'),
    C('"clicks" INTEGER NOT NULL DEFAULT 0'),
    CREATED_AT,
    UPDATED_AT,
  ]),
  table('AdImpression', [
    C('"id" TEXT NOT NULL PRIMARY KEY'),
    C('"advertisementId" TEXT NOT NULL'),
    C('"userId" TEXT'),
    C('"agencyId" TEXT'),
    C('"userRole" TEXT'),
    C('"action" TEXT NOT NULL'),
    C('"ipAddress" TEXT'),
    C('"userAgent" TEXT'),
    CREATED_AT,
  ]),
  table('BlogPost', [
    C('"id" TEXT NOT NULL PRIMARY KEY'),
    C('"title" TEXT NOT NULL'),
    C('"slug" TEXT NOT NULL'),
    C('"content" TEXT NOT NULL'),
    C('"excerpt" TEXT'),
    C('"coverImage" TEXT'),
    C('"category" TEXT NOT NULL DEFAULT \'actualites\''),
    C('"status" TEXT NOT NULL DEFAULT \'draft\''),
    C('"publishedAt" DATETIME'),
    C('"authorId" TEXT'),
    C('"views" INTEGER NOT NULL DEFAULT 0'),
    CREATED_AT,
    UPDATED_AT,
  ]),
  table('BlogView', [
    C('"id" TEXT NOT NULL PRIMARY KEY'),
    C('"postId" TEXT NOT NULL'),
    C('"userId" TEXT'),
    C('"agencyId" TEXT'),
    C('"ipAddress" TEXT'),
    C('"userAgent" TEXT'),
    CREATED_AT,
  ]),
  table('SystemLog', [
    C('"id" TEXT NOT NULL PRIMARY KEY'),
    C('"level" TEXT NOT NULL'),
    C('"message" TEXT NOT NULL'),
    C('"source" TEXT NOT NULL'),
    C('"metadata" TEXT'),
    CREATED_AT,
  ]),
  table('Checklist', [
    C('"id" TEXT NOT NULL PRIMARY KEY'),
    C('"code" TEXT NOT NULL'),
    C('"verificationKey" TEXT NOT NULL'),
    C('"firstName" TEXT NOT NULL'),
    C('"lastName" TEXT NOT NULL'),
    C('"email" TEXT NOT NULL'),
    C('"departureDate" TEXT NOT NULL'),
    C('"destinationCountry" TEXT NOT NULL'),
    C('"airline" TEXT'),
    C('"flightNumber" TEXT'),
    C('"items" TEXT NOT NULL'),
    C('"itemsCount" INTEGER NOT NULL DEFAULT 0'),
    C('"photoPath" TEXT'),
    C('"photoData" BLOB'),
    C('"photoMime" TEXT'),
    C('"photoSizeBytes" INTEGER DEFAULT 0'),
    C('"pdfPath" TEXT'),
    C('"pdfSizeBytes" INTEGER DEFAULT 0'),
    C('"viewCount" INTEGER NOT NULL DEFAULT 0'),
    C('"lastViewedAt" DATETIME'),
    C('"emailSent" BOOLEAN NOT NULL DEFAULT false'),
    C('"emailSentAt" DATETIME'),
    CREATED_AT,
    UPDATED_AT,
  ]),
  table('Review', [
    C('"id" TEXT NOT NULL PRIMARY KEY'),
    C('"name" TEXT NOT NULL'),
    C('"location" TEXT'),
    C('"rating" INTEGER NOT NULL DEFAULT 5'),
    C('"title" TEXT'),
    C('"content" TEXT NOT NULL'),
    C('"baggageRef" TEXT'),
    C('"isFeatured" BOOLEAN NOT NULL DEFAULT false'),
    C('"isApproved" BOOLEAN NOT NULL DEFAULT false'),
    C('"response" TEXT'),
    C('"language" TEXT NOT NULL DEFAULT \'fr\''),
    CREATED_AT,
    UPDATED_AT,
  ]),
  table('LossAlert', [
    C('"id" TEXT NOT NULL PRIMARY KEY'),
    C('"baggageId" TEXT NOT NULL'),
    C('"reference" TEXT NOT NULL'),
    C('"alertType" TEXT NOT NULL DEFAULT \'no_scan_after_arrival\''),
    C('"message" TEXT NOT NULL'),
    C('"dismissed" BOOLEAN NOT NULL DEFAULT false'),
    C('"dismissedAt" DATETIME'),
    CREATED_AT,
  ]),
]);

/**
 * Schéma attendu FINAL (fusion statique de secours + DMMF dynamique).
 * Source de vérité = prisma/schema.prisma via le client généré — toute
 * colonne ajoutée au schéma est automatiquement couverte au prochain boot.
 */
export const EXPECTED_SCHEMA: Record<string, ColumnDef[]> = buildMergedSchema();

export interface RepairReport {
  checked: boolean;
  tablesCreated: string[];
  columnsAdded: Array<{ table: string; column: string }>;
  errors: string[];
  pushAttempted: boolean;
  pushSucceeded: boolean | null;
  durationMs: number;
}

let repairing = false;
let lastReport: RepairReport | null = null;

/** Dernier rapport de réparation (pour /api/system/health). */
export function getLastRepairReport(): RepairReport | null {
  return lastReport;
}

/** Vérifie le schéma et répare ce qui manque. Idempotent, sans perte de données. */
export async function runSchemaRepair(): Promise<RepairReport> {
  const report: RepairReport = {
    checked: false,
    tablesCreated: [],
    columnsAdded: [],
    errors: [],
    pushAttempted: false,
    pushSucceeded: null,
    durationMs: 0,
  };
  const startedAt = Date.now();

  if (repairing) {
    report.errors.push('repair déjà en cours');
    return report;
  }
  repairing = true;

  try {
    const { db } = await import('./db');

    // Tables réellement présentes
    const existingTables = (await db.$queryRawUnsafe<Array<{ name: string }>>(
      `SELECT name FROM sqlite_master WHERE type='table'`,
    )).map((t) => t.name);
    const existingSet = new Set(existingTables);

    // 1) Tables manquantes → CREATE TABLE IF NOT EXISTS
    for (const [tableName, columns] of Object.entries(EXPECTED_SCHEMA)) {
      if (!existingSet.has(tableName)) {
        try {
          const ddl = `CREATE TABLE IF NOT EXISTS "${tableName}" (${columns.map((c) => c.ddl).join(', ')})`;
          await db.$executeRawUnsafe(ddl);
          report.tablesCreated.push(tableName);
          console.log(`[db-selfheal] table créée: ${tableName}`);
        } catch (e) {
          report.errors.push(`CREATE ${tableName}: ${e instanceof Error ? e.message.slice(0, 140) : String(e)}`);
        }
      }
    }

    // 2) Colonnes manquantes → ALTER TABLE ADD COLUMN
    for (const [tableName, columns] of Object.entries(EXPECTED_SCHEMA)) {
      let actualCols: Array<{ name: string }>;
      try {
        actualCols = (await db.$queryRawUnsafe<Array<{ name: string }>>(
          `PRAGMA table_info("${tableName}")`,
        )) as Array<{ name: string }>;
      } catch (e) {
        report.errors.push(`PRAGMA ${tableName}: ${e instanceof Error ? e.message.slice(0, 140) : String(e)}`);
        continue;
      }
      if (actualCols.length === 0) continue; // table inexistante (création a échoué) → db push gérera
      const colSet = new Set(actualCols.map((c) => c.name));
      for (const col of columns) {
        if (!colSet.has(col.name)) {
          try {
            await db.$executeRawUnsafe(`ALTER TABLE "${tableName}" ADD COLUMN ${col.ddl}`);
            report.columnsAdded.push({ table: tableName, column: col.name });
            console.log(`[db-selfheal] colonne ajoutée: ${tableName}.${col.name}`);
          } catch (e) {
            report.errors.push(`ALTER ${tableName}.${col.name}: ${e instanceof Error ? e.message.slice(0, 140) : String(e)}`);
          }
        }
      }
    }

    report.checked = true;

    // 3) Réconciliation complète via CLI si nécessaire (index, FK, types)
    if (report.tablesCreated.length > 0 || report.columnsAdded.length > 0 || report.errors.length > 0) {
      report.pushAttempted = true;
      report.pushSucceeded = await tryPrismaDbPush();
    }
  } catch (e) {
    report.errors.push(`global: ${e instanceof Error ? e.message.slice(0, 200) : String(e)}`);
  } finally {
    repairing = false;
    report.durationMs = Date.now() - startedAt;
    lastReport = report;
  }

  return report;
}

/** Tente `prisma db push --skip-generate` (dispo dans l'image Docker ≥ 74685fd et en dev). */
async function tryPrismaDbPush(): Promise<boolean | null> {
  try {
    const { execFile } = await import('child_process');
    const cwd = process.cwd();
    return await new Promise<boolean>((resolve) => {
      execFile(
        'npx',
        ['prisma', 'db', 'push', '--skip-generate'],
        { cwd, timeout: 120000, env: { ...process.env } },
        (error, stdout, stderr) => {
          const out = `${stdout || ''}${stderr || ''}`.trim();
          if (out) console.log(`[db-selfheal] prisma db push:\n${out.split('\n').slice(-6).join('\n')}`);
          if (error) console.warn(`[db-selfheal] prisma db push indisponible/échoué (${error.message.slice(0, 100)}) — réparations SQL conservées`);
          resolve(!error);
        },
      );
    });
  } catch {
    return null;
  }
}

/** Planifie la vérification : au boot (+BOOT_DELAY_MS) puis toutes les CHECK_INTERVAL_MS. */
export function startDbSelfheal(): void {
  setTimeout(() => {
    void runSchemaRepair().then((r) => {
      if (r.tablesCreated.length || r.columnsAdded.length) {
        console.log(`[db-selfheal] réparation boot: ${r.columnsAdded.length} colonne(s), ${r.tablesCreated.length} table(s)`);
      } else if (r.checked && r.errors.length === 0) {
        console.log('[db-selfheal] schéma OK');
      }
    });
  }, BOOT_DELAY_MS).unref?.();

  const interval = setInterval(() => {
    void runSchemaRepair();
  }, CHECK_INTERVAL_MS);
  interval.unref?.();

  console.log(`[db-selfheal] actif (boot +${BOOT_DELAY_MS / 1000}s, puis toutes les ${CHECK_INTERVAL_MS / 1000}s)`);
}
