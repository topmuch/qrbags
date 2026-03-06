import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Validation schema
const leadSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']).optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
});

// GET - List all leads
export async function GET() {
  try {
    const leads = await db.lead.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ leads });

  } catch (error) {
    console.error('Get leads error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new lead
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = leadSchema.parse(body);

    const lead = await db.lead.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone || '',
        company: validatedData.company || '',
        status: validatedData.status || 'new',
        source: validatedData.source || '',
        notes: validatedData.notes || '',
      }
    });

    return NextResponse.json({ lead });

  } catch (error) {
    console.error('Create lead error:', error);

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

// PUT - Update lead
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Lead ID is required' },
        { status: 400 }
      );
    }

    const lead = await db.lead.update({
      where: { id },
      data
    });

    return NextResponse.json({ lead });

  } catch (error) {
    console.error('Update lead error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete lead
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Lead ID is required' },
        { status: 400 }
      );
    }

    await db.lead.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete lead error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
