import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PUT - Declare baggage as lost
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

    // Only allow declaring active or scanned baggages as lost
    if (baggage.status !== 'active' && baggage.status !== 'scanned') {
      return NextResponse.json(
        { error: 'Cannot declare this baggage as lost' },
        { status: 400 }
      );
    }

    // Update baggage status and set declaredLostAt timestamp
    const updatedBaggage = await db.baggage.update({
      where: { id },
      data: {
        status: 'lost',
        declaredLostAt: new Date(),
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Baggage declared as lost',
      baggage: {
        id: updatedBaggage.id,
        reference: updatedBaggage.reference,
        status: updatedBaggage.status,
        declaredLostAt: updatedBaggage.declaredLostAt,
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
