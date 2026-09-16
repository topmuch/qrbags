import { NextRequest, NextResponse } from 'next/server';
import { createBackup, listBackups } from '@/lib/backup';
import { getSession } from '@/lib/session';

/**
 * 💾 POST /api/cron/backup — Crée un snapshot de la base SQLite.
 *
 * Déclencheurs possibles :
 *  - Cron externe (Coolify) : header `Authorization: Bearer ${CRON_SECRET}`
 *  - Superadmin connecté : session serveur valide
 *
 * GET /api/cron/backup — Liste les backups disponibles (superadmin ou cron).
 */
export const dynamic = 'force-dynamic';

async function isAuthorized(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true;

  // Sinon : session superadmin
  try {
    const user = await getSession();
    if (user && user.role === 'superadmin') return true;
  } catch {
    // pas de session
  }
  return false;
}

export async function POST(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const backup = await createBackup('cron');
  if (!backup) {
    return NextResponse.json(
      { error: 'Échec de la création du backup' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: `Backup créé : ${backup.filename}`,
    backup,
    total: listBackups().length,
  });
}

export async function GET(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const backups = listBackups();
  return NextResponse.json({
    backups,
    total: backups.length,
    totalBytes: backups.reduce((acc, b) => acc + b.sizeBytes, 0),
  });
}
