import { NextRequest, NextResponse } from 'next/server';
import { sendPostTripEmails } from '@/lib/post-trip';

// Cron secret for authorization
const CRON_SECRET = process.env.CRON_SECRET || 'your-cron-secret-key';

/**
 * ✈️ Cron endpoint : e-mails post-voyage (48 h après le départ).
 * Envoie « tout s'est bien passé ? » + rappel checkliste gratuite / QR codes
 * sur qrbags.com pour le prochain voyage.
 *
 * À appeler périodiquement (ex. toutes les 30 min) :
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://qrbags.com/api/cron/post-trip
 *
 * Un déclencheur interne (src/instrumentation.ts) fait aussi tourner la
 * vérification toutes les 30 min — ce endpoint sert de secours / cron externe.
 */

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const secretFromQuery = request.nextUrl.searchParams.get('secret');
  return authHeader === `Bearer ${CRON_SECRET}` || secretFromQuery === CRON_SECRET;
}

async function run(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const batchSize = Math.min(
      Math.max(parseInt(request.nextUrl.searchParams.get('batch') || '20', 10) || 20, 1),
      100
    );

    const result = await sendPostTripEmails(batchSize);
    return NextResponse.json({
      success: true,
      ...result,
      ranAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[cron/post-trip] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return run(request);
}

export async function POST(request: NextRequest) {
  return run(request);
}
