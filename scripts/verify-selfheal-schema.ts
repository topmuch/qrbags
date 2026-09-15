/**
 * Vérifie que les colonnes de db-selfheal (EXPECTED_SCHEMA) correspondent
 * exactement aux champs scalaires du schéma Prisma.
 * Détecte toute dérive avant déploiement production.
 */
import * as fs from 'fs';
import * as path from 'path';

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

// ─── Parse models ligne par ligne (robuste aux commentaires avec accolades) ───
const models: Record<string, string[]> = {};
let currentModel: string | null = null;
for (const rawLine of schemaContent.split('\n')) {
  const line = rawLine.split('//')[0].trim(); // retire les commentaires
  if (!line) continue;
  const modelStart = line.match(/^model\s+(\w+)\s*\{/);
  if (modelStart) {
    currentModel = modelStart[1];
    models[currentModel] = [];
    continue;
  }
  if (currentModel) {
    if (line === '}') {
      currentModel = null;
      continue;
    }
    if (line.startsWith('@@')) continue;
    const parts = line.split(/\s+/);
    if (parts.length >= 2) {
      const [name, type] = parts;
      const scalarTypes = ['Int', 'String', 'Boolean', 'Float', 'DateTime', 'Json', 'Decimal', 'BigInt', 'Bytes'];
      if (scalarTypes.includes(type.replace('?', ''))) {
        models[currentModel].push(name);
      }
    }
  }
}

// ─── Parse selfheal EXPECTED_SCHEMA ───
const selfhealPath = path.join(__dirname, '..', 'src', 'lib', 'db-selfheal.ts');
const selfhealContent = fs.readFileSync(selfhealPath, 'utf-8');
const selfhealTables: Record<string, string[]> = {};
// table('Name', [ ... ]) — le corps contient des guillemets échappés \'
const tableRegex = /table\('(\w+)'\s*,\s*\[([\s\S]*?)\]\s*\)/g;
let t: RegExpExecArray | null;
while ((t = tableRegex.exec(selfhealContent)) !== null) {
  const tableName = t[1];
  const body = t[2];
  const cols: string[] = [];
  // C('...') avec gestion des \' échappés
  const cRegex = /C\('((?:[^'\\]|\\.)*)'\)/g;
  let c: RegExpExecArray | null;
  while ((c = cRegex.exec(body)) !== null) {
    const colName = c[1].match(/^"([^"]+)"/)?.[1];
    if (colName) cols.push(colName);
  }
  if (body.includes('CREATED_AT')) cols.push('createdAt');
  if (body.includes('UPDATED_AT')) cols.push('updatedAt');
  selfhealTables[tableName] = [...new Set(cols)];
}

let hasError = false;
console.log('Comparaison Prisma schema ↔ db-selfheal EXPECTED_SCHEMA\n');

for (const [modelName, prismaFields] of Object.entries(models)) {
  const selfhealCols = selfhealTables[modelName];
  if (!selfhealCols) {
    console.log(`❌ ${modelName}: ABSENT du selfheal !`);
    hasError = true;
    continue;
  }
  const missingInSelfheal = prismaFields.filter((f) => !selfhealCols.includes(f));
  const extraInSelfheal = selfhealCols.filter((f) => !prismaFields.includes(f));
  if (missingInSelfheal.length || extraInSelfheal.length) {
    if (missingInSelfheal.length) {
      console.log(`❌ ${modelName}: manquant dans selfheal: ${missingInSelfheal.join(', ')}`);
      hasError = true;
    }
    if (extraInSelfheal.length) {
      console.log(`⚠️  ${modelName}: colonnes en trop dans selfheal: ${extraInSelfheal.join(', ')}`);
    }
  } else {
    console.log(`✅ ${modelName} (${prismaFields.length} colonnes OK)`);
  }
}

for (const tableName of Object.keys(selfhealTables)) {
  if (!models[tableName]) {
    console.log(`⚠️  ${tableName}: dans selfheal mais pas dans Prisma`);
  }
}

console.log(hasError ? '\n>>> ERREURS DÉTECTÉES' : '\n>>> SCHÉMA SELFHEAL 100% ALIGNÉ');
process.exit(hasError ? 1 : 0);
