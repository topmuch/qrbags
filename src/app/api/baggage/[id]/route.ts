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
}

// Agency row type
interface AgencyRow {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  logo: string | null;
}

// PUT - Update a baggage by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if baggage exists using raw SQL
    const existingBaggages = await db.$queryRaw<BaggageRow[]>`
      SELECT id, reference, type, status, travelerFirstName, travelerLastName, whatsappOwner
      FROM Baggage WHERE id = ${id} LIMIT 1
    `;

    if (!existingBaggages || existingBaggages.length === 0) {
      return NextResponse.json(
        { error: 'Baggage not found' },
        { status: 404 }
      );
    }

    const updateData: Record<string, string | null> = {};
    if (body.travelerFirstName !== undefined) updateData.travelerFirstName = body.travelerFirstName || null;
    if (body.travelerLastName !== undefined) updateData.travelerLastName = body.travelerLastName || null;
    if (body.whatsappOwner !== undefined) updateData.whatsappOwner = body.whatsappOwner || null;
    if (body.status !== undefined) updateData.status = body.status;

    if (Object.keys(updateData).length > 0) {
      try {
        await db.baggage.update({ where: { id }, data: updateData });
      } catch {
        return NextResponse.json({ error: 'Baggage not found' }, { status: 404 });
      }
    }

    // Fetch updated baggage
    const updatedBaggages = await db.$queryRaw<BaggageRow[]>`
      SELECT id, reference, travelerFirstName, travelerLastName, whatsappOwner, status
      FROM Baggage WHERE id = ${id} LIMIT 1
    `;

    const updatedBaggage = updatedBaggages[0];

    return NextResponse.json({
      success: true,
      baggage: {
        id: updatedBaggage.id,
        reference: updatedBaggage.reference,
        travelerFirstName: updatedBaggage.travelerFirstName,
        travelerLastName: updatedBaggage.travelerLastName,
        whatsappOwner: updatedBaggage.whatsappOwner,
        status: updatedBaggage.status,
      }
    });

  } catch (error) {
    console.error('Update baggage error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a baggage by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if baggage exists using raw SQL
    const existingBaggages = await db.$queryRaw<BaggageRow[]>`
      SELECT id FROM Baggage WHERE id = ${id} LIMIT 1
    `;

    if (!existingBaggages || existingBaggages.length === 0) {
      return NextResponse.json(
        { error: 'Baggage not found' },
        { status: 404 }
      );
    }

    // Delete related scan logs first
    await db.$executeRaw`DELETE FROM ScanLog WHERE baggageId = ${id}`;

    // Delete the baggage
    await db.$executeRaw`DELETE FROM Baggage WHERE id = ${id}`;

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

    const baggages = await db.$queryRaw<BaggageRow[]>`
      SELECT
        id, reference, type, setId, agencyId,
        travelerFirstName, travelerLastName, whatsappOwner,
        baggageIndex, baggageType, status,
        flightNumber, destination, createdAt, expiresAt,
        lastScanDate, lastLocation, declaredLostAt, foundAt
      FROM Baggage WHERE id = ${id} LIMIT 1
    `;

    if (!baggages || baggages.length === 0) {
      return NextResponse.json(
        { error: 'Baggage not found' },
        { status: 404 }
      );
    }

    const baggage = baggages[0];

    // Get agency info if exists
    let agency: AgencyRow | null = null;
    if (baggage.agencyId) {
      const agencies = await db.$queryRaw<AgencyRow[]>`
        SELECT id, name, slug, email, phone, address, logo
        FROM Agency WHERE id = ${baggage.agencyId} LIMIT 1
      `;
      agency = agencies && agencies.length > 0 ? agencies[0] : null;
    }

    return NextResponse.json({
      id: baggage.id,
      reference: baggage.reference,
      type: baggage.type,
      travelerFirstName: baggage.travelerFirstName,
      travelerLastName: baggage.travelerLastName,
      whatsappOwner: baggage.whatsappOwner,
      baggageIndex: baggage.baggageIndex,
      baggageType: baggage.baggageType,
      status: baggage.status,
      agencyId: baggage.agencyId,
      agency: agency ? {
        id: agency.id,
        name: agency.name,
        email: agency.email,
        phone: agency.phone,
      } : null,
      createdAt: baggage.createdAt,
      expiresAt: baggage.expiresAt,
      lastScanDate: baggage.lastScanDate,
      lastLocation: baggage.lastLocation,
      declaredLostAt: baggage.declaredLostAt,
      foundAt: baggage.foundAt,
    });

  } catch (error) {
    console.error('Get baggage error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
