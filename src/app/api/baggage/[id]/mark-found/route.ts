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
