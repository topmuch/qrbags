import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// DELETE - Delete a baggage by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if baggage exists
    const baggage = await db.baggage.findUnique({
      where: { id },
    });

    if (!baggage) {
      return NextResponse.json(
        { error: 'Baggage not found' },
        { status: 404 }
      );
    }

    // Delete related scan logs first
    await db.scanLog.deleteMany({
      where: { baggageId: id },
    });

    // Delete the baggage
    await db.baggage.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Baggage deleted successfully'
    });

  } catch (error) {
    console.error('Delete baggage error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get a single baggage by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const baggage = await db.baggage.findUnique({
      where: { id },
      include: { agency: true },
    });

    if (!baggage) {
      return NextResponse.json(
        { error: 'Baggage not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      baggage: {
        id: baggage.id,
        reference: baggage.reference,
        type: baggage.type,
        travelerFirstName: baggage.travelerFirstName,
        travelerLastName: baggage.travelerLastName,
        whatsappOwner: baggage.whatsappOwner,
        baggageIndex: baggage.baggageIndex,
        baggageType: baggage.baggageType,
        status: baggage.status,
        createdAt: baggage.createdAt,
        expiresAt: baggage.expiresAt,
        lastScanDate: baggage.lastScanDate,
        lastLocation: baggage.lastLocation,
        agency: baggage.agency?.name || null,
      }
    });

  } catch (error) {
    console.error('Get baggage error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
