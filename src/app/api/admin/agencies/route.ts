import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { getSession } from '@/lib/session';

// Validation schema
const agencySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
});

// GET - List all agencies (SuperAdmin only)
export async function GET() {
  try {
    // Authentication check
    const user = await getSession();
    if (!user || user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const agencies = await db.agency.findMany({
      include: {
        _count: {
          select: { baggages: true, users: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ agencies });

  } catch (error) {
    console.error('Get agencies error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new agency (SuperAdmin only)
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const user = await getSession();
    if (!user || user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = agencySchema.parse(body);

    // Check if slug already exists
    const existing = await db.agency.findUnique({
      where: { slug: validatedData.slug }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Slug already exists' },
        { status: 400 }
      );
    }

    const agency = await db.agency.create({
      data: {
        name: validatedData.name,
        slug: validatedData.slug,
        email: validatedData.email || null,
        phone: validatedData.phone || null,
        address: validatedData.address || null,
      }
    });

    return NextResponse.json({ agency });

  } catch (error) {
    console.error('Create agency error:', error);
    
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

// PUT - Update agency (SuperAdmin only)
export async function PUT(request: NextRequest) {
  try {
    // Authentication check
    const user = await getSession();
    if (!user || user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...data } = body;
    const validatedData = agencySchema.parse(data);

    const agency = await db.agency.update({
      where: { id },
      data: {
        name: validatedData.name,
        slug: validatedData.slug,
        email: validatedData.email || null,
        phone: validatedData.phone || null,
        address: validatedData.address || null,
      }
    });

    return NextResponse.json({ agency });

  } catch (error) {
    console.error('Update agency error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete agency (SuperAdmin only)
export async function DELETE(request: NextRequest) {
  try {
    // Authentication check
    const user = await getSession();
    if (!user || user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Agency ID is required' },
        { status: 400 }
      );
    }

    await db.agency.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete agency error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
