import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateReference, generateSetId, calculateExpirationDate, generateCuid } from '@/lib/qr';
import { db } from '@/lib/db';

// Schema for individual generation
const individualSchema = z.object({
  context: z.literal('individual'),
  type: z.enum(['hajj', 'voyageur']),
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  whatsapp: z.string().min(6).max(20),
  duration: z.enum(['7d', '1y']),
  baggageCount: z.number().min(1).max(3),
});

// Schema for agency generation
const agencySchema = z.object({
  context: z.literal('agency'),
  type: z.enum(['hajj', 'voyageur']),
  agencyId: z.string().min(1),
  count: z.number().min(1).max(3),
  travelerCount: z.number().min(1).max(1000),
});

// Combined schema using discriminated union
const combinedSchema = z.discriminatedUnion('context', [
  individualSchema,
  agencySchema
]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = combinedSchema.parse(body);

    if (validatedData.context === 'individual') {
      // Generate for individual traveler
      const references = await generateBaggagesWithTraveler({
        type: validatedData.type,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        whatsapp: validatedData.whatsapp,
        duration: validatedData.duration,
        baggageCount: validatedData.baggageCount as 1 | 3,
      });

      return NextResponse.json({
        success: true,
        generated: references.length,
        references
      });
    } else {
      // Generate for agency
      const allReferences: string[] = [];

      for (let i = 0; i < validatedData.travelerCount; i++) {
        const references = await generateBaggages({
          type: validatedData.type,
          agencyId: validatedData.agencyId,
          count: validatedData.type === 'hajj' ? 3 : validatedData.count as 1 | 3
        });
        allReferences.push(...references);
      }

      return NextResponse.json({
        success: true,
        generated: allReferences.length,
        references: allReferences
      });
    }
  } catch (error) {
    console.error('Generate QR error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Erreur de validation', details: error.errors },
        { status: 400 }
      );
    }

    // Log full error for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Full error:', errorMessage);

    return NextResponse.json(
      { error: 'Erreur serveur', details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Generate baggages for individual traveler with traveler info
 * Uses raw SQL for maximum database compatibility
 */
async function generateBaggagesWithTraveler(options: {
  type: 'hajj' | 'voyageur';
  firstName: string;
  lastName: string;
  whatsapp: string;
  duration: '7d' | '1y';
  baggageCount: 1 | 3;
}): Promise<string[]> {
  const { type, firstName, lastName, whatsapp, duration, baggageCount } = options;
  const references: string[] = [];

  // Generate a unique set ID for this batch
  const setId = generateSetId(type);
  const expiresAt = calculateExpirationDate(type, duration === '1y' ? 'tag' : 'sticker');
  const expiresAtStr = expiresAt.toISOString();

  for (let i = 0; i < baggageCount; i++) {
    const reference = await generateReference(type);
    const id = generateCuid();
    const now = new Date().toISOString();

    // Use raw SQL directly
    await db.$executeRaw`
      INSERT INTO Baggage (
        id, reference, type, setId, agencyId,
        travelerFirstName, travelerLastName, whatsappOwner,
        baggageIndex, baggageType, status, expiresAt, createdAt
      ) VALUES (
        ${id}, ${reference}, ${type}, ${setId}, null,
        ${firstName}, ${lastName}, ${whatsapp},
        ${i + 1}, ${i === 0 ? 'cabine' : 'soute'}, 'active', ${expiresAtStr}, ${now}
      )
    `;

    references.push(reference);
  }

  return references;
}

/**
 * Generate baggages for agency (no traveler info, needs activation)
 * Uses raw SQL for maximum database compatibility
 */
async function generateBaggages(options: {
  type: 'hajj' | 'voyageur';
  agencyId?: string;
  count: 1 | 3;
}): Promise<string[]> {
  const { type, agencyId, count } = options;
  const references: string[] = [];

  // Generate a unique set ID for this batch
  const setId = generateSetId(type);

  for (let i = 0; i < count; i++) {
    const reference = await generateReference(type);
    const id = generateCuid();
    const now = new Date().toISOString();

    // Use raw SQL directly
    await db.$executeRaw`
      INSERT INTO Baggage (
        id, reference, type, setId, agencyId,
        baggageIndex, baggageType, status, createdAt
      ) VALUES (
        ${id}, ${reference}, ${type}, ${setId}, ${agencyId || null},
        ${i + 1}, ${i === 0 ? 'cabine' : 'soute'}, 'pending_activation', ${now}
      )
    `;

    references.push(reference);
  }

  return references;
}

// GET - Get all baggages (for QR codes list)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get('agencyId');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '500');

    // Build where clause for raw query
    let whereClause = 'WHERE 1=1';
    const params: (string | number)[] = [];

    if (agencyId) {
      whereClause += ' AND agencyId = ?';
      params.push(agencyId);
    }

    if (type) {
      whereClause += ' AND type = ?';
      params.push(type);
    }

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    const query = `
      SELECT
        id, reference, type, setId, agencyId,
        travelerFirstName, travelerLastName, whatsappOwner,
        baggageIndex, baggageType, status, createdAt, expiresAt
      FROM Baggage
      ${whereClause}
      ORDER BY createdAt DESC
      LIMIT ?
    `;
    params.push(limit);

    const baggages = await db.$queryRawUnsafe<any[]>(query, ...params);

    return NextResponse.json({ baggages });
  } catch (error) {
    console.error('Get baggages error:', error);
    return NextResponse.json(
      { error: 'Internal server error', baggages: [] },
      { status: 500 }
    );
  }
}
