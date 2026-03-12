import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateReference, generateSetId, calculateExpirationDate } from '@/lib/qr';
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

  for (let i = 0; i < baggageCount; i++) {
    const reference = await generateReference(type);

    // Use raw SQL for maximum compatibility
    await createBaggageRaw({
      reference,
      type,
      setId,
      agencyId: null,
      travelerFirstName: firstName,
      travelerLastName: lastName,
      whatsappOwner: whatsapp,
      baggageIndex: i + 1,
      baggageType: i === 0 ? 'cabine' : 'soute',
      status: 'active',
      expiresAt
    });

    references.push(reference);
  }

  return references;
}

/**
 * Generate baggages for agency (no traveler info, needs activation)
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

    // Use raw SQL for maximum compatibility
    await createBaggageRaw({
      reference,
      type,
      setId,
      agencyId: agencyId || null,
      travelerFirstName: null,
      travelerLastName: null,
      whatsappOwner: null,
      baggageIndex: i + 1,
      baggageType: i === 0 ? 'cabine' : 'soute',
      status: 'pending_activation',
      expiresAt: null
    });

    references.push(reference);
  }

  return references;
}

/**
 * Create baggage using raw SQL for maximum database compatibility
 */
async function createBaggageRaw(data: {
  reference: string;
  type: string;
  setId: string;
  agencyId: string | null;
  travelerFirstName: string | null;
  travelerLastName: string | null;
  whatsappOwner: string | null;
  baggageIndex: number;
  baggageType: string;
  status: string;
  expiresAt: Date | null;
}): Promise<void> {
  const id = generateCuid();
  const now = new Date().toISOString();
  const expiresAtStr = data.expiresAt ? data.expiresAt.toISOString() : null;

  // First try with Prisma client
  try {
    await db.baggage.create({
      data: {
        id,
        reference: data.reference,
        type: data.type,
        setId: data.setId,
        agencyId: data.agencyId,
        travelerFirstName: data.travelerFirstName,
        travelerLastName: data.travelerLastName,
        whatsappOwner: data.whatsappOwner,
        baggageIndex: data.baggageIndex,
        baggageType: data.baggageType,
        status: data.status,
        expiresAt: data.expiresAt,
      }
    });
    return;
  } catch (prismaError) {
    console.log('Prisma create failed, trying raw SQL:', prismaError);
  }

  // Fallback to raw SQL
  try {
    await db.$executeRaw`
      INSERT INTO Baggage (
        id, reference, type, setId, agencyId,
        travelerFirstName, travelerLastName, whatsappOwner,
        baggageIndex, baggageType, status, expiresAt, createdAt
      ) VALUES (
        ${id}, ${data.reference}, ${data.type}, ${data.setId}, ${data.agencyId},
        ${data.travelerFirstName}, ${data.travelerLastName}, ${data.whatsappOwner},
        ${data.baggageIndex}, ${data.baggageType}, ${data.status}, ${expiresAtStr}, ${now}
      )
    `;
  } catch (rawError) {
    console.error('Raw SQL insert also failed:', rawError);
    throw new Error(`Failed to create baggage: ${rawError instanceof Error ? rawError.message : 'Unknown error'}`);
  }
}

/**
 * Generate a CUID-like ID
 */
function generateCuid(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `c${timestamp}${random}`;
}

// GET - Get all baggages (for QR codes list)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get('agencyId');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '500');

    const where: Record<string, unknown> = {};

    if (agencyId) {
      where.agencyId = agencyId;
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    let baggages;
    try {
      baggages = await db.baggage.findMany({
        where,
        include: { agency: true },
        orderBy: { createdAt: 'desc' },
        take: limit
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ baggages: [] });
    }

    return NextResponse.json({ baggages });
  } catch (error) {
    console.error('Get baggages error:', error);
    return NextResponse.json(
      { error: 'Internal server error', baggages: [] },
      { status: 500 }
    );
  }
}
