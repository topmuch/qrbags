import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Baggage row type
interface BaggageRow {
  id: string;
  reference: string;
  status: string;
  type: string;
  agencyId: string | null;
  createdAt: string;
  lastScanDate: string | null;
  declaredLostAt: string | null;
  foundAt: string | null;
  founderName: string | null;
  founderPhone: string | null;
  founderAt: string | null;
  travelerFirstName: string | null;
  travelerLastName: string | null;
}

// Agency row type
interface AgencyRow {
  id: string;
  name: string;
}

// GET - Fetch report statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get('agencyId');
    const period = searchParams.get('period') || 'week'; // week, month, year
    const includeFounders = searchParams.get('founders') === 'true';

    // Calculate date ranges
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default: // week
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const startDateStr = startDate.toISOString();

    // Build query
    let whereClause = 'createdAt >= ?';
    const params: (string)[] = [startDateStr];

    if (agencyId) {
      whereClause += ' AND agencyId = ?';
      params.push(agencyId);
    }

    // Fetch baggages using raw SQL
    const baggages = await db.$queryRawUnsafe<BaggageRow[]>(
      `SELECT
        id, reference, status, type, agencyId,
        createdAt, lastScanDate, declaredLostAt, foundAt,
        founderName, founderPhone, founderAt,
        travelerFirstName, travelerLastName
       FROM Baggage
       WHERE ${whereClause}
       ORDER BY createdAt DESC`,
      ...params
    );

    // Get agencies for name lookup
    const agenciesRaw = await db.$queryRaw<AgencyRow[]>`
      SELECT id, name FROM Agency
    `;
    const agencyMap = new Map<string, string>();
    (agenciesRaw || []).forEach(a => agencyMap.set(a.id, a.name));

    // Calculate statistics
    const baggagesList = baggages || [];
    const stats = {
      total: baggagesList.length,
      pending_activation: baggagesList.filter(b => b.status === 'pending_activation').length,
      active: baggagesList.filter(b => b.status === 'active').length,
      scanned: baggagesList.filter(b => b.status === 'scanned').length,
      lost: baggagesList.filter(b => b.status === 'lost').length,
      found: baggagesList.filter(b => b.status === 'found').length,
      blocked: baggagesList.filter(b => b.status === 'blocked').length,
      hajj: baggagesList.filter(b => b.type === 'hajj').length,
      voyageur: baggagesList.filter(b => b.type === 'voyageur').length,
      withFounder: baggagesList.filter(b => b.founderName !== null).length,
    };

    // Recovery rate (found / (lost + found))
    const recoveryRate = stats.lost + stats.found > 0
      ? Math.round((stats.found / (stats.lost + stats.found)) * 100)
      : 100;

    // Daily evolution (last 7 days) using raw SQL
    const dailyStats: { date: string; count: number; label: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const dayStart = `${dateStr}T00:00:00.000Z`;
      const dayEnd = `${dateStr}T23:59:59.999Z`;

      let dayCount = 0;
      if (agencyId) {
        const result = await db.$queryRaw<[{ count: number }]>`
          SELECT COUNT(*) as count FROM Baggage
          WHERE createdAt >= ${dayStart} AND createdAt <= ${dayEnd} AND agencyId = ${agencyId}
        `;
        dayCount = result[0]?.count || 0;
      } else {
        const result = await db.$queryRaw<[{ count: number }]>`
          SELECT COUNT(*) as count FROM Baggage
          WHERE createdAt >= ${dayStart} AND createdAt <= ${dayEnd}
        `;
        dayCount = result[0]?.count || 0;
      }

      dailyStats.push({
        date: dateStr,
        count: dayCount,
        label: date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
      });
    }

    // Weekly evolution (last 4 weeks) using raw SQL
    const weeklyStats: { week: number; count: number; label: string }[] = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const weekStartStr = weekStart.toISOString();
      const weekEndStr = weekEnd.toISOString();

      let weekCount = 0;
      if (agencyId) {
        const result = await db.$queryRaw<[{ count: number }]>`
          SELECT COUNT(*) as count FROM Baggage
          WHERE createdAt >= ${weekStartStr} AND createdAt < ${weekEndStr} AND agencyId = ${agencyId}
        `;
        weekCount = result[0]?.count || 0;
      } else {
        const result = await db.$queryRaw<[{ count: number }]>`
          SELECT COUNT(*) as count FROM Baggage
          WHERE createdAt >= ${weekStartStr} AND createdAt < ${weekEndStr}
        `;
        weekCount = result[0]?.count || 0;
      }

      weeklyStats.push({
        week: 4 - i,
        count: weekCount,
        label: `Semaine ${4 - i}`,
      });
    }

    // Scan logs count using raw SQL
    let scanLogsCount = 0;
    if (agencyId) {
      const result = await db.$queryRaw<[{ count: number }]>`
        SELECT COUNT(*) as count FROM ScanLog s
        INNER JOIN Baggage b ON s.baggageId = b.id
        WHERE s.createdAt >= ${startDateStr} AND b.agencyId = ${agencyId}
      `;
      scanLogsCount = result[0]?.count || 0;
    } else {
      const result = await db.$queryRaw<[{ count: number }]>`
        SELECT COUNT(*) as count FROM ScanLog WHERE createdAt >= ${startDateStr}
      `;
      scanLogsCount = result[0]?.count || 0;
    }

    // Founder stats
    const founderBaggages = includeFounders ? baggagesList.filter(b =>
      b.founderName &&
      (b.status === 'scanned' || b.status === 'lost')
    ).map(b => ({
      id: b.id,
      reference: b.reference,
      status: b.status,
      founderName: b.founderName,
      founderPhone: b.founderPhone,
      founderAt: b.founderAt,
      travelerName: `${b.travelerFirstName || ''} ${b.travelerLastName || ''}`.trim(),
      agencyName: b.agencyId ? (agencyMap.get(b.agencyId) || 'N/A') : 'N/A',
      lastScanDate: b.lastScanDate,
    })) : [];

    return NextResponse.json({
      stats,
      recoveryRate,
      dailyStats,
      weeklyStats,
      scanLogsCount,
      period,
      founderBaggages,
    });
  } catch (error) {
    console.error('Reports API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
