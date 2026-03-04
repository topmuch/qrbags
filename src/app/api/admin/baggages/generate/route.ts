import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateBaggages } from '@/lib/qr';
import { z } from 'zod';

// Validation schema
const generateSchema = z.object({
  type: z.enum(['hajj', 'voyageur']),
  agencyId: z.string().optional(),
  count: z.number().min(1).max(3),
  travelerCount: z.number().min(1).max(1000),
});

// POST - Generate QR codes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = generateSchema.parse(body);

    // For Hajj, agency is required
    if (validatedData.type === 'hajj' && !validatedData.agencyId) {
      return NextResponse.json(
        { error: 'Agency is required for Hajj type' },
        { status: 400 }
      );
    }

    const allReferences: string[] = [];

    // Generate baggages for each traveler
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

  } catch (error) {
    console.error('Generate QR error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
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
