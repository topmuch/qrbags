import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateCuid } from '@/lib/qr';

// Baggage row type
interface BaggageRow {
  id: string;
  reference: string;
  type: string;
  setId: string | null;
  agencyId: string | null;
  status: string;
}

// Agency row type
interface AgencyRow {
  id: string;
  name: string;
  slug: string;
}

// PUT - Declare baggage as lost
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get baggage using raw SQL
    const baggages = await db.$queryRaw<BaggageRow[]>`
      SELECT id, reference, type, setId, agencyId, status
      FROM Baggage WHERE id = ${id} LIMIT 1
    `;

    if (!baggages || baggages.length === 0) {
      return NextResponse.json(
        { error: 'Baggage not found' },
        { status: 404 }
      );
    }

    const baggage = baggages[0];

    // Only allow declaring active or scanned baggages as lost
    if (baggage.status !== 'active' && baggage.status !== 'scanned') {
      return NextResponse.json(
        { error: 'Cannot declare this baggage as lost' },
        { status: 400 }
      );
    }

    // Get agency if exists
    let agency: AgencyRow | null = null;
    if (baggage.agencyId) {
      const agencies = await db.$queryRaw<AgencyRow[]>`
        SELECT id, name, slug FROM Agency WHERE id = ${baggage.agencyId} LIMIT 1
      `;
      agency = agencies && agencies.length > 0 ? agencies[0] : null;
    }

    // Update baggage status and set declaredLostAt timestamp
    const now = new Date().toISOString();
    await db.$executeRaw`
      UPDATE Baggage SET status = 'lost', declaredLostAt = ${now} WHERE id = ${id}
    `;

    // Create notification for SuperAdmin using raw SQL
    const notificationId = generateCuid();
    await db.$executeRaw`
      INSERT INTO Notification (id, type, userId, agencyId, baggageId, message, data, read, createdAt, updatedAt)
      VALUES (
        ${notificationId},
        'baggage_declared_lost',
        null,
        ${baggage.agencyId},
        ${baggage.id},
        ${`🚨 L'agence ${agency?.name || 'Inconnue'} a déclaré le bagage ${baggage.reference} comme perdu`},
        ${JSON.stringify({
          reference: baggage.reference,
          agencyName: agency?.name,
          type: baggage.type,
        })},
        0,
        ${now},
        ${now}
      )
    `;

    return NextResponse.json({
      success: true,
      message: 'Baggage declared as lost',
      baggage: {
        id: baggage.id,
        reference: baggage.reference,
        status: 'lost',
        declaredLostAt: now,
      }
    });

  } catch (error) {
    console.error('Declare lost error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
