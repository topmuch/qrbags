import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

// GET - Download database backup
export async function GET(request: NextRequest) {
  try {
    const user = await getSession();

    if (!user || user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const dbPath = '/app/data/custom.db';

    // Check if database exists
    if (!fs.existsSync(dbPath)) {
      return NextResponse.json({ error: 'Base de données non trouvée' }, { status: 404 });
    }

    // Read database file
    const dbBuffer = fs.readFileSync(dbPath);

    // Generate filename with date
    const date = new Date().toISOString().split('T')[0];
    const filename = `qrbag-backup-${date}.db`;

    // Return file as download
    return new NextResponse(dbBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': dbBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Backup error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la sauvegarde' },
      { status: 500 }
    );
  }
}

// POST - Get backup info or restore backup
export async function POST(request: NextRequest) {
  try {
    const user = await getSession();

    if (!user || user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const dbPath = '/app/data/custom.db';
    const backupDir = '/app/data/backups';

    // Get database stats
    let dbStats: { size: number; sizeMB: string; modified: Date } | null = null;
    if (fs.existsSync(dbPath)) {
      const stats = fs.statSync(dbPath);
      dbStats = {
        size: stats.size,
        sizeMB: (stats.size / 1024 / 1024).toFixed(2),
        modified: stats.mtime,
      };
    }

    // List existing backups
    let backups: { name: string; size: string; date: Date }[] = [];
    if (fs.existsSync(backupDir)) {
      const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.db'));
      backups = files.map(f => {
        const stats = fs.statSync(path.join(backupDir, f));
        return {
          name: f,
          size: (stats.size / 1024 / 1024).toFixed(2) + ' MB',
          date: stats.mtime,
        };
      });
    }

    return NextResponse.json({
      database: dbStats,
      backups,
      backupDir,
    });

  } catch (error) {
    console.error('Backup info error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des infos' },
      { status: 500 }
    );
  }
}

// PUT - Restore backup from uploaded file
export async function PUT(request: NextRequest) {
  try {
    const user = await getSession();

    if (!user || user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const dbPath = '/app/data/custom.db';
    const backupDir = '/app/data/backups';
    const tempPath = '/app/data/restore_temp.db';

    // Get form data with the uploaded file
    const formData = await request.formData();
    const file = formData.get('backup') as File;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    // Validate file type
    if (!file.name.endsWith('.db')) {
      return NextResponse.json({ error: 'Le fichier doit être un fichier .db' }, { status: 400 });
    }

    // Create backup directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Create a backup of current database before restore
    if (fs.existsSync(dbPath)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const preRestoreBackup = path.join(backupDir, `pre-restore-${timestamp}.db`);
      fs.copyFileSync(dbPath, preRestoreBackup);
    }

    // Write uploaded file to temp location
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    fs.writeFileSync(tempPath, buffer);

    // Validate it's a valid SQLite database
    try {
      const { stderr } = await execAsync(`sqlite3 "${tempPath}" ".tables"`);
      if (stderr && stderr.includes('Error')) {
        fs.unlinkSync(tempPath);
        return NextResponse.json({ error: 'Fichier de base de données invalide' }, { status: 400 });
      }
    } catch {
      // sqlite3 might not be installed, skip validation
      // We'll trust the file if it has .db extension
    }

    // Replace current database with uploaded one
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
    fs.renameSync(tempPath, dbPath);

    return NextResponse.json({
      success: true,
      message: 'Base de données restaurée avec succès',
      restoredFrom: file.name,
    });

  } catch (error) {
    console.error('Restore error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la restauration: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
