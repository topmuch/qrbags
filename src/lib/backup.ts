import fs from 'fs';
import path from 'path';
import { db } from '@/lib/db';

/**
 * QRBag — Backups automatiques de la base SQLite.
 *
 * Stratégie :
 *  - Snapshot consistant via `VACUUM INTO` (SQLite natif, sans verrou long,
 *    cohérent même sous trafic — contrairement à une simple copie de fichier).
 *  - Rotation : garde les N derniers backups (défaut 14 ≈ 2 semaines).
 *  - Déclencheurs : boot serveur (1×/jour max) + endpoint cron + cleanup cron.
 *
 * Dossier : <projet>/db/backups/ (monté dans le volume persistant Coolify).
 */

const DEFAULT_RETENTION = 14;

export function getBackupDir(): string {
  // db/ se trouve à la racine du projet (DATABASE_URL=file:.../db/custom.db)
  const url = process.env.DATABASE_URL || '';
  const match = url.match(/file:(.*)/);
  const dbPath = match ? match[1] : path.join(process.cwd(), 'db', 'custom.db');
  return path.join(path.dirname(dbPath), 'backups');
}

export interface BackupInfo {
  filename: string;
  sizeBytes: number;
  createdAt: string;
}

/** Crée un snapshot consistant de la base. Retourne les infos du fichier créé. */
export async function createBackup(reason: string = 'manual'): Promise<BackupInfo | null> {
  try {
    const url = process.env.DATABASE_URL || '';
    const match = url.match(/file:(.*)/);
    if (!match) {
      console.warn('[backup] DATABASE_URL non reconnue, backup ignoré');
      return null;
    }
    const dbPath = match[1];
    if (!fs.existsSync(dbPath)) {
      console.warn('[backup] Fichier DB introuvable :', dbPath);
      return null;
    }

    const backupDir = getBackupDir();
    fs.mkdirSync(backupDir, { recursive: true });

    const now = new Date();
    const stamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const target = path.join(backupDir, `qrbag-backup-${stamp}.db`);

    // VACUUM INTO = snapshot consistant garanti par SQLite
    await db.$executeRawUnsafe(`VACUUM INTO '${target.replace(/'/g, "''")}'`);

    const sizeBytes = fs.existsSync(target) ? fs.statSync(target).size : 0;

    // Rotation : supprime les plus anciens au-delà de la rétention
    const retention = parseInt(process.env.BACKUP_RETENTION || '', 10) || DEFAULT_RETENTION;
    const files = fs
      .readdirSync(backupDir)
      .filter(f => f.startsWith('qrbag-backup-') && f.endsWith('.db'))
      .sort(); // ordre chronologique (stamp ISO)
    const removed: string[] = [];
    while (files.length > retention) {
      const oldest = files.shift();
      if (oldest) {
        try {
          fs.unlinkSync(path.join(backupDir, oldest));
          removed.push(oldest);
        } catch {
          // fichier verrouillé → on retentera au prochain cycle
        }
      }
    }

    console.log(
      `[backup] ✅ Snapshot créé (${reason}) : ${path.basename(target)} (${(sizeBytes / 1024).toFixed(0)} Ko)` +
        (removed.length ? ` — rotation : ${removed.length} ancien(s) supprimé(s)` : '')
    );

    return { filename: path.basename(target), sizeBytes, createdAt: now.toISOString() };
  } catch (error) {
    // Ne JAMAIS faire planter le serveur pour un backup
    console.error('[backup] ❌ Échec du snapshot :', error);
    return null;
  }
}

/** Liste les backups disponibles (du plus récent au plus ancien). */
export function listBackups(): BackupInfo[] {
  try {
    const backupDir = getBackupDir();
    if (!fs.existsSync(backupDir)) return [];
    return fs
      .readdirSync(backupDir)
      .filter(f => f.startsWith('qrbag-backup-') && f.endsWith('.db'))
      .sort()
      .reverse()
      .map(filename => {
        const full = path.join(backupDir, filename);
        const stat = fs.statSync(full);
        return {
          filename,
          sizeBytes: stat.size,
          createdAt: stat.mtime.toISOString(),
        };
      });
  } catch {
    return [];
  }
}

/** Marqueur « dernier backup » — évite les backups multiples le même jour. */
const LAST_BACKUP_MARKER = path.join(getBackupDir(), '.last-backup');

export async function backupIfNeededOncePerDay(reason: string = 'boot'): Promise<BackupInfo | null> {
  try {
    if (fs.existsSync(LAST_BACKUP_MARKER)) {
      const last = fs.statSync(LAST_BACKUP_MARKER).mtime.getTime();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      if (Date.now() - last < twentyFourHours) {
        return null; // déjà fait aujourd'hui
      }
    }
  } catch {
    // marker illisible → on refait un backup
  }

  const result = await createBackup(reason);
  try {
    fs.mkdirSync(path.dirname(LAST_BACKUP_MARKER), { recursive: true });
    fs.utimesSync(LAST_BACKUP_MARKER, new Date(), new Date());
  } catch {
    // marker non critique
  }
  return result;
}
