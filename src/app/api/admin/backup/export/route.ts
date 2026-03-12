import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Export database as JSON file
export async function GET(request: NextRequest) {
  try {
    // Fetch all data from database using raw SQL to avoid missing column errors
    const [
      users,
      agencies,
      baggages,
      scanLogs,
      settings,
      pages,
      banners,
      featureFlags,
      messages,
    ] = await Promise.all([
      db.$queryRaw`SELECT * FROM User`,
      db.$queryRaw`SELECT * FROM Agency`,
      db.$queryRaw`SELECT * FROM Baggage`,
      db.$queryRaw`SELECT * FROM ScanLog`,
      db.$queryRaw`SELECT * FROM Setting`,
      db.$queryRaw`SELECT * FROM Page`,
      db.$queryRaw`SELECT * FROM Banner`,
      db.$queryRaw`SELECT * FROM FeatureFlag`,
      db.$queryRaw`SELECT * FROM Message`,
    ]);

    // Create backup object
    const backup = {
      version: '1.0',
      createdAt: new Date().toISOString(),
      data: {
        users,
        agencies,
        baggages,
        scanLogs,
        settings,
        pages,
        banners,
        featureFlags,
        messages,
      },
      stats: {
        users: Array.isArray(users) ? users.length : 0,
        agencies: Array.isArray(agencies) ? agencies.length : 0,
        baggages: Array.isArray(baggages) ? baggages.length : 0,
        scanLogs: Array.isArray(scanLogs) ? scanLogs.length : 0,
        settings: Array.isArray(settings) ? settings.length : 0,
        pages: Array.isArray(pages) ? pages.length : 0,
        banners: Array.isArray(banners) ? banners.length : 0,
        featureFlags: Array.isArray(featureFlags) ? featureFlags.length : 0,
        messages: Array.isArray(messages) ? messages.length : 0,
      }
    };

    // Create filename with date
    const date = new Date().toISOString().split('T')[0];
    const filename = `qrbag-backup-${date}.json`;

    // Return as downloadable JSON file
    return new NextResponse(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export database' },
      { status: 500 }
    );
  }
}
