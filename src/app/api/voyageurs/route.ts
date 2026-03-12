import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Baggage row type
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
  createdAt: string;
  lastScanDate: string | null;
  lastLocation: string | null;
}

// Agency row type
interface AgencyRow {
  id: string;
  name: string;
}

// GET - List all travelers with their baggages
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const agencyId = searchParams.get('agencyId');
    const search = searchParams.get('search');

    // Build where conditions for raw SQL
    const conditions: string[] = ['travelerFirstName IS NOT NULL'];
    const params: (string | number)[] = [];

    if (type && type !== 'all') {
      conditions.push('type = ?');
      params.push(type);
    }

    if (agencyId && agencyId !== 'all') {
      conditions.push('agencyId = ?');
      params.push(agencyId);
    }

    if (status && status !== 'all') {
      conditions.push('status = ?');
      params.push(status);
    }

    // Search conditions
    if (search) {
      conditions.push('(travelerFirstName LIKE ? OR travelerLastName LIKE ? OR reference LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm.toUpperCase());
    }

    const whereClause = conditions.join(' AND ');

    // Get all activated baggages using raw SQL
    const baggages = await db.$queryRawUnsafe<BaggageRow[]>(
      `SELECT
        id, reference, type, setId, agencyId,
        travelerFirstName, travelerLastName, whatsappOwner,
        baggageIndex, baggageType, status, createdAt,
        lastScanDate, lastLocation
       FROM Baggage
       WHERE ${whereClause}
       ORDER BY createdAt DESC`,
      ...params
    );

    // Get agencies for lookup
    const agencies = await db.$queryRaw<AgencyRow[]>`
      SELECT id, name FROM Agency
    `;

    const agencyMap = new Map<string, string>();
    (agencies || []).forEach(a => agencyMap.set(a.id, a.name));

    // Group by traveler (first name + last name + whatsapp)
    const travelersMap = new Map<string, {
      id: string;
      firstName: string;
      lastName: string;
      whatsapp: string;
      type: string;
      agencyName: string | null;
      baggages: BaggageRow[];
      lastScan: Date | null;
    }>();

    (baggages || []).forEach((baggage) => {
      const key = `${baggage.travelerFirstName}_${baggage.travelerLastName}_${baggage.whatsappOwner}`;

      if (!travelersMap.has(key)) {
        travelersMap.set(key, {
          id: key,
          firstName: baggage.travelerFirstName || '',
          lastName: baggage.travelerLastName || '',
          whatsapp: baggage.whatsappOwner || '',
          type: baggage.type,
          agencyName: baggage.agencyId ? (agencyMap.get(baggage.agencyId) || null) : null,
          baggages: [],
          lastScan: null,
        });
      }

      const traveler = travelersMap.get(key)!;
      traveler.baggages.push(baggage);

      // Update last scan
      if (baggage.lastScanDate) {
        const scanDate = new Date(baggage.lastScanDate);
        if (!traveler.lastScan || scanDate > traveler.lastScan) {
          traveler.lastScan = scanDate;
        }
      }
    });

    // Convert to array
    const travelers = Array.from(travelersMap.values()).map((traveler) => ({
      ...traveler,
      baggages: traveler.baggages.map((b) => ({
        id: b.id,
        reference: b.reference,
        type: b.type,
        baggageIndex: b.baggageIndex,
        baggageType: b.baggageType,
        status: b.status,
        lastScanDate: b.lastScanDate,
        lastLocation: b.lastLocation,
      })),
      lastScan: traveler.lastScan?.toISOString() || null,
    }));

    return NextResponse.json({
      travelers,
      total: travelers.length,
    });

  } catch (error) {
    console.error('Get travelers error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
