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

// PUT - Mark lost baggage as found
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

    // Only allow marking lost baggages as found
    if (baggage.status !== 'lost') {
      return NextResponse.json(
        { error: 'This baggage is not marked as lost' },
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

    const now = new Date().toISOString();

    // Update baggage status and set foundAt timestamp
    await db.$executeRaw`
      UPDATE Baggage SET status = 'found', foundAt = ${now} WHERE id = ${id}
    `;

    // Mark existing "baggage_declared_lost" notifications for this baggage as read
    await db.$executeRaw`
      UPDATE Notification SET read = 1, updatedAt = ${now}
      WHERE baggageId = ${id} AND type = 'baggage_declared_lost' AND read = 0
    `;

    // Create notification for SuperAdmin
    const notificationId = generateCuid();
    await db.$executeRaw`
      INSERT INTO Notification (id, type, userId, agencyId, baggageId, message, data, read, createdAt, updatedAt)
      VALUES (
        ${notificationId},
        'baggage_found',
        null,
        ${baggage.agencyId},
        ${baggage.id},
        ${`Le bagage ${baggage.reference} a été marqué comme retrouvé !`},
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
      message: 'Baggage marked as found',
      baggage: {
        id: baggage.id,
        reference: baggage.reference,
        status: 'found',
        foundAt: now,
      }
    });

  } catch (error) {
    console.error('Mark found error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
