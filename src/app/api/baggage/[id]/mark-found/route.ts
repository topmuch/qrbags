import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PUT - Mark lost baggage as found
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const baggage = await db.baggage.findUnique({
      where: { id },
      include: { agency: true }
    });

    if (!baggage) {
      return NextResponse.json(
        { error: 'Baggage not found' },
        { status: 404 }
      );
    }

    // Only allow marking lost baggages as found
    if (baggage.status !== 'lost') {
      return NextResponse.json(
        { error: 'This baggage is not marked as lost' },
        { status: 400 }
      );
    }

    // Update baggage status and set foundAt timestamp
    const updatedBaggage = await db.baggage.update({
      where: { id },
      data: {
        status: 'found',
        foundAt: new Date(),
      }
    });

    // Mark any existing "baggage_declared_lost" notifications for this baggage as read
    await db.notification.updateMany({
      where: {
        baggageId: baggage.id,
        type: 'baggage_declared_lost',
        read: false,
      },
      data: {
        read: true,
      }
    });

    // 🔔 Create notification for SuperAdmin
    await db.notification.create({
      data: {
        type: 'baggage_found',
        userId: null, // broadcast to all superadmins
        agencyId: baggage.agencyId,
        baggageId: baggage.id,
        message: `Le bagage ${baggage.reference} a été marqué comme retrouvé !`,
        data: JSON.stringify({
          reference: baggage.reference,
          agencyName: baggage.agency?.name,
          type: baggage.type,
        }),
        read: false,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Baggage marked as found',
      baggage: {
        id: updatedBaggage.id,
        reference: updatedBaggage.reference,
        status: updatedBaggage.status,
        foundAt: updatedBaggage.foundAt,
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
