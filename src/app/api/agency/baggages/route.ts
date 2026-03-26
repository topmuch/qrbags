import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

// Baggage type for raw query results (columns that exist in production DB)
interface BaggageRow {
  id: string;
  reference: string;
  type: string;
  setId: string | null;
  agencyId: string | null;
  travelerFirstName: string | null;
  travelerLastName: string | null;
  whatsappOwner: string | null;
  baggageIndex: number;
  baggageType: string;
  status: string;
  flightNumber: string | null;
  destination: string | null;
  createdAt: string;
  expiresAt: string | null;
  lastScanDate: string | null;
  lastLocation: string | null;
  declaredLostAt: string | null;
  foundAt: string | null;
  founderName: string | null;
  founderPhone: string | null;
  founderAt: string | null;
}

// GET - List all baggages for an agency
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const user = await getSession();
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié', baggages: [], stats: { total: 0, pending: 0, active: 0, scanned: 0, lost: 0, found: 0 } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get('agencyId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const grouped = searchParams.get('grouped'); // New parameter for grouped view

    if (!agencyId) {
      return NextResponse.json(
        { error: 'Agency ID is required', baggages: [], stats: { total: 0, pending: 0, active: 0, scanned: 0, lost: 0, found: 0 } },
        { status: 400 }
      );
    }

    // Security: Verify user has access to this agency
    // Superadmin can access any agency, agency users can only access their own
    if (user.role !== 'superadmin' && user.agencyId !== agencyId) {
      return NextResponse.json(
        { error: 'Accès non autorisé', baggages: [], stats: { total: 0, pending: 0, active: 0, scanned: 0, lost: 0, found: 0 } },
        { status: 403 }
      );
    }

    let baggages: BaggageRow[] = [];

    try {
      // Use raw SQL to avoid issues with missing columns (marketingOptin, lastContactedAt)
      // Build the query dynamically based on filters
      let whereClause = 'WHERE agencyId = ?';
      const params: (string | number)[] = [agencyId];

      if (status && status !== 'all') {
        whereClause += ' AND status = ?';
        params.push(status);
      }

      if (search) {
        whereClause += ' AND (reference LIKE ? OR travelerFirstName LIKE ? OR travelerLastName LIKE ? OR setId LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      // Query only columns that exist in the database
      const query = `
        SELECT
          id, reference, type, setId, agencyId,
          travelerFirstName, travelerLastName, whatsappOwner,
          baggageIndex, baggageType, status,
          flightNumber, destination, createdAt, expiresAt,
          lastScanDate, lastLocation, declaredLostAt, foundAt,
          founderName, founderPhone, founderAt
        FROM Baggage
        ${whereClause}
        ORDER BY createdAt DESC
      `;

      baggages = await db.$queryRawUnsafe<BaggageRow[]>(query, ...params);

    } catch (dbError) {
      console.error('Database error fetching baggages:', dbError);
      // Return empty response instead of crashing
      return NextResponse.json({
        baggages: [],
        stats: { total: 0, pending: 0, active: 0, scanned: 0, lost: 0, found: 0 },
        error: 'Database temporarily unavailable'
      });
    }

    // Calculate stats
    const stats = {
      total: baggages.length,
      pending: baggages.filter(b => b.status === 'pending_activation').length,
      active: baggages.filter(b => b.status === 'active').length,
      scanned: baggages.filter(b => b.status === 'scanned').length,
      lost: baggages.filter(b => b.status === 'lost').length,
      found: baggages.filter(b => b.status === 'found').length,
    };

    // If grouped view is requested, group by setId
    if (grouped === 'true') {
      const groups: Record<string, {
        setId: string | null;
        travelerFirstName: string | null;
        travelerLastName: string | null;
        whatsappOwner: string | null;
        type: string;
        createdAt: string;
        baggages: BaggageRow[];
      }> = {};

      baggages.forEach(baggage => {
        const groupKey = baggage.setId || `single-${baggage.id}`;

        if (!groups[groupKey]) {
          groups[groupKey] = {
            setId: baggage.setId,
            travelerFirstName: baggage.travelerFirstName,
            travelerLastName: baggage.travelerLastName,
            whatsappOwner: baggage.whatsappOwner,
            type: baggage.type,
            createdAt: baggage.createdAt,
            baggages: []
          };
        }
        groups[groupKey].baggages.push(baggage);
      });

      // Convert to array and sort
      const groupedBaggages = Object.values(groups).sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return NextResponse.json({
        baggages,
        groupedBaggages,
        stats
      });
    }

    return NextResponse.json({
      baggages,
      stats
    });

  } catch (error) {
    console.error('Get baggages error:', error);
    // Return a valid response structure even on error
    return NextResponse.json({
      error: 'Internal server error',
      baggages: [],
      stats: { total: 0, pending: 0, active: 0, scanned: 0, lost: 0, found: 0 }
    }, { status: 500 });
  }
}
