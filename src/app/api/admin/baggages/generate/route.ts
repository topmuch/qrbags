import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateReference, generateReferencesBulk, generateSetId, calculateExpirationDate, QrDuration } from '@/lib/qr';
import { db } from '@/lib/db';

// Duration enum shared by individual + agency schemas
const durationEnum = z.enum(['1m', '3m', '6m', '1y']);

// Schema for individual generation
const individualSchema = z.object({
  context: z.literal('individual'),
  type: z.enum(['hajj', 'voyageur']),
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  whatsapp: z.string().min(6).max(20),
  duration: durationEnum,
  baggageCount: z.number().min(1).max(2),
});

// Schema for agency generation
const agencySchema = z.object({
  context: z.literal('agency'),
  type: z.enum(['hajj', 'voyageur']),
  agencyId: z.string().min(1),
  count: z.number().min(1).max(2),
  travelerCount: z.number().min(1).max(1000),
  duration: durationEnum,
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
        baggageCount: validatedData.baggageCount as 1 | 2,
      });

      return NextResponse.json({
        success: true,
        generated: references.length,
        references
      });
    } else {
      // Generate for agency - use batch insert for performance
      const result = await generateBaggagesBatch({
        type: validatedData.type,
        agencyId: validatedData.agencyId,
        travelerCount: validatedData.travelerCount,
        count: validatedData.type === 'hajj' ? 3 : validatedData.count as 1 | 3,
        duration: validatedData.duration,
      });

      return NextResponse.json({
        success: true,
        generated: result.length,
        references: result
      });
    }
  } catch (error) {
    console.error('Generate QR error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    // Prisma foreign key violation (P2003) — agencyId doesn't exist
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2003') {
      return NextResponse.json(
        { error: 'L\'agence sélectionnée n\'existe pas. Veuillez créer une agence d\'abord ou sélectionner une agence valide.' },
        { status: 400 }
      );
    }

    // Generic error — expose the message in dev for easier debugging
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
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
  duration: QrDuration;
  baggageCount: 1 | 2;
}): Promise<string[]> {
  const { type, firstName, lastName, whatsapp, duration, baggageCount } = options;
  
  const setId = generateSetId(type);
  const expiresAt = calculateExpirationDate(type, undefined, duration);

  // Generate all references upfront
  const references: string[] = [];
  for (let i = 0; i < baggageCount; i++) {
    references.push(await generateReference(type));
  }

  // Batch create all baggages at once
  await db.baggage.createMany({
    data: references.map((reference, i) => ({
      reference,
      type,
      setId,
      agencyId: null,
      travelerFirstName: firstName,
      travelerLastName: lastName,
      whatsappOwner: whatsapp,
      baggageIndex: i + 1,
      baggageType: 'soute',
      status: 'active',
      expiresAt,
      duration,
    })),
  });

  return references;
}

/**
 * Generate baggages for agency using BATCH INSERT for high performance.
 * Uses bulk reference generation and createMany to avoid thousands of sequential DB calls.
 */
async function generateBaggagesBatch(options: {
  type: 'hajj' | 'voyageur';
  agencyId: string;
  travelerCount: number;
  count: 1 | 2;
  duration: QrDuration;
}): Promise<string[]> {
  const { type, agencyId, travelerCount, count, duration } = options;
  const totalBaggages = travelerCount * count;
  
  console.log(`[GENERATE] Starting bulk generation: ${travelerCount} travelers × ${count} bags = ${totalBaggages} QR codes (duration: ${duration})`);

  // Pre-generate all set IDs (no DB calls needed)
  const setIds: string[] = [];
  for (let t = 0; t < travelerCount; t++) {
    setIds.push(generateSetId(type));
  }

  // Generate ALL references in bulk (1-2 DB queries instead of 1800)
  const allReferences = await generateReferencesBulk(type, totalBaggages);

  // Compute expiresAt once (same for all baggages in this batch)
  // Note: in agency mode, baggages are 'pending_activation' — expiresAt will be
  // recomputed at activation time by /api/activate, BUT we store the chosen
  // duration on each row so the activation endpoint can honor it.
  // We also pre-set expiresAt as a safety default.
  const expiresAt = calculateExpirationDate(type, undefined, duration);

  // Build all baggage data
  const allData: Array<{
    reference: string;
    type: string;
    setId: string;
    agencyId: string | null;
    baggageIndex: number;
    baggageType: string;
    status: string;
    expiresAt: Date;
    duration: string;
  }> = [];

  let refIndex = 0;
  for (let t = 0; t < travelerCount; t++) {
    const setId = setIds[t];
    for (let i = 0; i < count; i++) {
      allData.push({
        reference: allReferences[refIndex++],
        type,
        setId,
        agencyId,
        baggageIndex: i + 1,
        baggageType: 'soute',
        status: 'pending_activation',
        expiresAt,
        duration,
      });
    }
  }

  // Batch insert in chunks of 200 for memory efficiency
  const BATCH_SIZE = 200;
  for (let i = 0; i < allData.length; i += BATCH_SIZE) {
    const batch = allData.slice(i, i + BATCH_SIZE);
    await db.baggage.createMany({ data: batch });
    console.log(`[GENERATE] Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} baggages (total: ${Math.min(i + BATCH_SIZE, allData.length)}/${allData.length})`);
  }

  console.log(`[GENERATE] Complete: ${totalBaggages} QR codes generated for ${travelerCount} travelers`);
  return allReferences;
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

    const baggages = await db.baggage.findMany({
      where,
      include: { agency: true },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return NextResponse.json({ baggages });
  } catch (error) {
    console.error('Get baggages error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
