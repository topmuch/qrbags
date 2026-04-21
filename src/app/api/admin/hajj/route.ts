import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

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
}

// Agency row type
interface AgencyRow {
  id: string;
  name: string;
}

// GET - Fetch Hajj pilgrims with their baggages
export async function GET() {
  try {
    const user = await getSession();
    if (!user || (user.role !== 'superadmin' && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Get all Hajj baggages using raw SQL
    const baggages = await db.$queryRaw<BaggageRow[]>`
      SELECT
        id, reference, type, setId, agencyId,
        travelerFirstName, travelerLastName, whatsappOwner,
        baggageIndex, baggageType, status, createdAt
      FROM Baggage
      WHERE type = 'hajj'
      ORDER BY createdAt DESC
    `;

    // Get agencies with hajj baggages
    const agenciesRaw = await db.$queryRaw<AgencyRow[]>`
      SELECT DISTINCT a.id, a.name
      FROM Agency a
      INNER JOIN Baggage b ON a.id = b.agencyId
      WHERE b.type = 'hajj'
      ORDER BY a.name ASC
    `;

    // Build agency map for quick lookup
    const agencyMap = new Map<string, AgencyRow>();
    (agenciesRaw || []).forEach(a => agencyMap.set(a.id, a));

    // Group baggages by traveler (firstName + lastName combination)
    const pilgrimsMap = new Map<string, {
      id: string;
      firstName: string;
      lastName: string;
      whatsapp: string | null;
      agencyId: string | null;
      agency: { id: string; name: string } | null;
      createdAt: Date;
      baggages: BaggageRow[];
    }>();

    (baggages || []).forEach(baggage => {
      const key = `${baggage.travelerFirstName || 'Unknown'}_${baggage.travelerLastName || 'Unknown'}_${baggage.agencyId || 'no-agency'}`;

      if (!pilgrimsMap.has(key)) {
        const agency = baggage.agencyId ? agencyMap.get(baggage.agencyId) : null;
        pilgrimsMap.set(key, {
          id: key,
          firstName: baggage.travelerFirstName || 'Unknown',
          lastName: baggage.travelerLastName || 'Unknown',
          whatsapp: baggage.whatsappOwner,
          agencyId: baggage.agencyId,
          agency: agency ? { id: agency.id, name: agency.name } : null,
          createdAt: new Date(baggage.createdAt),
          baggages: []
        });
      }

      pilgrimsMap.get(key)!.baggages.push(baggage);
    });

    // Convert to array and sort by creation date
    const pilgrims = Array.from(pilgrimsMap.values()).sort((a, b) =>
      b.createdAt.getTime() - a.createdAt.getTime()
    );

    return NextResponse.json({
      pilgrims,
      agencies: agenciesRaw || []
    });
  } catch (error) {
    console.error('Error fetching Hajj pilgrims:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des pèlerins' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a pilgrim and all their baggages
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pilgrimKey = searchParams.get('id');

    if (!pilgrimKey) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    // Parse the key to get traveler info
    const [firstName, lastName, agencyPart] = pilgrimKey.split('_');
    const agencyId = agencyPart === 'no-agency' ? null : agencyPart;

    // Delete all baggages for this pilgrim using raw SQL
    await db.$executeRaw`
      DELETE FROM Baggage
      WHERE type = 'hajj'
        AND travelerFirstName = ${firstName}
        AND travelerLastName = ${lastName}
        AND agencyId = ${agencyId}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pilgrim:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}
