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
}

// Agency row type
interface AgencyRow {
  id: string;
  name: string;
}

// GET - Fetch Voyageurs (type: voyageur)
export async function GET() {
  try {
    // Get all Voyageur baggages using raw SQL
    const baggages = await db.$queryRaw<BaggageRow[]>`
      SELECT
        id, reference, type, setId, agencyId,
        travelerFirstName, travelerLastName, whatsappOwner,
        baggageIndex, baggageType, status, createdAt
      FROM Baggage
      WHERE type = 'voyageur'
      ORDER BY createdAt DESC
    `;

    // Get agencies with voyageur baggages
    const agenciesRaw = await db.$queryRaw<AgencyRow[]>`
      SELECT DISTINCT a.id, a.name
      FROM Agency a
      INNER JOIN Baggage b ON a.id = b.agencyId
      WHERE b.type = 'voyageur'
      ORDER BY a.name ASC
    `;

    // Build agency map
    const agencyMap = new Map<string, AgencyRow>();
    (agenciesRaw || []).forEach(a => agencyMap.set(a.id, a));

    // Group baggages by traveler
    const travelersMap = new Map<string, {
      id: string;
      firstName: string | null;
      lastName: string | null;
      whatsapp: string | null;
      agencyId: string | null;
      agency: { id: string; name: string } | null;
      baggageCount: number;
      baggages: BaggageRow[];
      createdAt: Date;
      baggageIds: string[];
    }>();

    (baggages || []).forEach(baggage => {
      // Create a unique key using JSON stringify
      const keyData = {
        firstName: baggage.travelerFirstName || '',
        lastName: baggage.travelerLastName || '',
        whatsapp: baggage.whatsappOwner || '',
        agencyId: baggage.agencyId || ''
      };
      const key = JSON.stringify(keyData);

      if (!travelersMap.has(key)) {
        const agency = baggage.agencyId ? agencyMap.get(baggage.agencyId) : null;
        travelersMap.set(key, {
          id: key,
          firstName: baggage.travelerFirstName,
          lastName: baggage.travelerLastName,
          whatsapp: baggage.whatsappOwner,
          agencyId: baggage.agencyId,
          agency: agency ? { id: agency.id, name: agency.name } : null,
          baggageCount: 0,
          baggages: [],
          createdAt: new Date(baggage.createdAt),
          baggageIds: []
        });
      }

      const traveler = travelersMap.get(key)!;
      traveler.baggages.push(baggage);
      traveler.baggageCount = traveler.baggages.length;
      traveler.baggageIds.push(baggage.id);
    });

    // Convert to array and sort
    const travelers = Array.from(travelersMap.values()).sort((a, b) =>
      b.createdAt.getTime() - a.createdAt.getTime()
    );

    return NextResponse.json({
      travelers,
      agencies: agenciesRaw || []
    });
  } catch (error) {
    console.error('Error fetching voyageurs:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des voyageurs' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a traveler and all their baggages
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const travelerKey = searchParams.get('id');

    if (!travelerKey) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    console.log('[DELETE VOYAGEUR] Key received:', travelerKey);

    // Parse the key
    let keyData: { firstName: string; lastName: string; whatsapp: string; agencyId: string };
    try {
      keyData = JSON.parse(travelerKey);
    } catch {
      console.error('[DELETE VOYAGEUR] Failed to parse key');
      return NextResponse.json({ error: 'Clé invalide' }, { status: 400 });
    }

    const { firstName, lastName, whatsapp, agencyId } = keyData;

    console.log('[DELETE VOYAGEUR] Parsed:', { firstName, lastName, whatsapp, agencyId });

    // Find baggages using raw SQL
    const baggages = await db.$queryRaw<BaggageRow[]>`
      SELECT id, reference
      FROM Baggage
      WHERE type = 'voyageur'
        AND (travelerFirstName = ${firstName || null} OR (${firstName || ''} = '' AND travelerFirstName IS NULL))
        AND (travelerLastName = ${lastName || null} OR (${lastName || ''} = '' AND travelerLastName IS NULL))
        AND (whatsappOwner = ${whatsapp || null} OR (${whatsapp || ''} = '' AND whatsappOwner IS NULL))
        AND (agencyId = ${agencyId || null} OR (${agencyId || ''} = '' AND agencyId IS NULL))
    `;

    console.log(`[DELETE VOYAGEUR] Found ${baggages?.length || 0} baggages`);

    if (!baggages || baggages.length === 0) {
      return NextResponse.json({
        error: 'Voyageur non trouvé',
        key: keyData
      }, { status: 404 });
    }

    const baggageIds = baggages.map(b => b.id);

    // Delete scan logs first
    if (baggageIds.length > 0) {
      const placeholders = baggageIds.map(() => '?').join(',');
      await db.$executeRawUnsafe(
        `DELETE FROM ScanLog WHERE baggageId IN (${placeholders})`,
        ...baggageIds
      );

      // Delete baggages
      await db.$executeRawUnsafe(
        `DELETE FROM Baggage WHERE id IN (${placeholders})`,
        ...baggageIds
      );
    }

    console.log(`[DELETE VOYAGEUR] Deleted ${baggages.length} baggages`);

    return NextResponse.json({
      success: true,
      deletedCount: baggages.length,
      deletedReferences: baggages.map(b => b.reference)
    });
  } catch (error) {
    console.error('Error deleting traveler:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression', details: String(error) },
      { status: 500 }
    );
  }
}
