import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateExpirationDate } from '@/lib/qr';
import { z } from 'zod';

// Baggage row type for raw queries
interface BaggageRow {
  id: string;
  reference: string;
  type: string;
  setId: string | null;
  agencyId: string | null;
  status: string;
  createdAt: string;
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

// Validation schema for activation
const activateSchema = z.object({
  reference: z.string().min(1, 'Reference is required'),
  travelerFirstName: z.string().min(1, 'First name is required'),
  travelerLastName: z.string().min(1, 'Last name is required'),
  whatsappOwner: z.string().min(1, 'WhatsApp number is required'),
  flightNumber: z.string().optional(),
  destination: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = activateSchema.parse(body);

    // Find the baggage by reference using raw SQL
    const baggageRows = await db.$queryRaw<BaggageRow[]>`
      SELECT id, reference, type, setId, agencyId, status, createdAt
      FROM Baggage
      WHERE reference = ${validatedData.reference}
      LIMIT 1
    `;

    if (!baggageRows || baggageRows.length === 0) {
      return NextResponse.json(
        { error: 'Baggage not found', message: 'Code QR non valide' },
        { status: 404 }
      );
    }

    const baggage = baggageRows[0];

    if (baggage.status !== 'pending_activation') {
      return NextResponse.json(
        { error: 'Already activated', message: 'Ce bagage a déjà été activé' },
        { status: 400 }
      );
    }

    // Determine subtype for expiration calculation
    const subtype = baggage.type === 'voyageur' ? 'sticker' : undefined;

    // Calculate expiration date
    const expiresAt = calculateExpirationDate(baggage.type as 'hajj' | 'voyageur', subtype);
    const expiresAtStr = expiresAt.toISOString();
    const now = new Date().toISOString();

    // Update baggage with traveler info using raw SQL
    await db.$executeRaw`
      UPDATE Baggage SET
        travelerFirstName = ${validatedData.travelerFirstName},
        travelerLastName = ${validatedData.travelerLastName},
        whatsappOwner = ${validatedData.whatsappOwner},
        flightNumber = ${validatedData.flightNumber || null},
        destination = ${validatedData.destination || null},
        status = 'active',
        expiresAt = ${expiresAtStr},
        createdAt = ${now}
      WHERE id = ${baggage.id}
    `;

    // If this is part of a group (Hajj has 3 bags), activate all related baggages
    if (baggage.type === 'hajj' && baggage.agencyId) {
      // Find all baggages with same setId (they belong to the same traveler)
      const relatedBaggages = await db.$queryRaw<BaggageRow[]>`
        SELECT id, reference, type, setId, agencyId, status
        FROM Baggage
        WHERE setId = ${baggage.setId}
          AND agencyId = ${baggage.agencyId}
          AND status = 'pending_activation'
      `;

      // Activate all related baggages
      for (const related of relatedBaggages) {
        if (related.id !== baggage.id) {
          await db.$executeRaw`
            UPDATE Baggage SET
              travelerFirstName = ${validatedData.travelerFirstName},
              travelerLastName = ${validatedData.travelerLastName},
              whatsappOwner = ${validatedData.whatsappOwner},
              status = 'active',
              expiresAt = ${expiresAtStr},
              createdAt = ${now}
            WHERE id = ${related.id}
          `;
        }
      }
    }

    return NextResponse.json({
      success: true,
      baggage: {
        id: baggage.id,
        reference: baggage.reference,
        type: baggage.type,
        status: 'active',
        expiresAt: expiresAtStr,
      }
    });

  } catch (error) {
    console.error('Activation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
