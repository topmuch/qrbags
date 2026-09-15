import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getBackupDir } from '@/lib/backup';
import { getSession } from '@/lib/session';

/**
 * 💾 GET /api/cron/backup/download?file=qrbag-backup-XXX.db
 *
 * Télécharge un snapshot SQLite (superadmin uniquement).
 * - Nom strictement validé (anti path-traversal)
 * - Le fichier doit exister dans le dossier des backups
 */
export const dynamic = 'force-dynamic';

const FILENAME_RE = /^qrbag-backup-[0-9T-]+\.db$/;

export async function GET(request: NextRequest) {
  // Session superadmin obligatoire (pas de CRON_SECRET ici : téléchargement UI)
  let authorized = false;
  try {
    const user = await getSession();
    if (user && user.role === 'superadmin') authorized = true;
  } catch {
    authorized = false;
  }
  if (!authorized) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const filename = new URL(request.url).searchParams.get('file') || '';
  if (!FILENAME_RE.test(filename)) {
    return NextResponse.json({ error: 'Nom de fichier invalide' }, { status: 400 });
  }

  const backupDir = path.resolve(getBackupDir());
  const target = path.resolve(backupDir, filename);

  // Double barrière anti path-traversal
  if (!target.startsWith(backupDir + path.sep)) {
    return NextResponse.json({ error: 'Nom de fichier invalide' }, { status: 400 });
  }
  if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
    return NextResponse.json({ error: 'Backup introuvable' }, { status: 404 });
  }

  const buffer = fs.readFileSync(target);
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(buffer.length),
      'Cache-Control': 'no-store',
    },
  });
}
