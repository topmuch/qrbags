import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST - Add observation to lead
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { type, content, date, userId } = body;

    // Validate required fields
    if (!type || !content) {
      return NextResponse.json(
        { error: 'Type and content are required' },
        { status: 400 }
      );
    }

    // Create observation
    const observation = await prisma.observation.create({
      data: {
        leadId: id,
        type,
        content,
        date: date ? new Date(date) : new Date(),
        userId: userId || 'system', // Use system if no user provided
      },
      include: {
        user: {
          select: { id: true, name: true }
        }
      }
    });

    return NextResponse.json({ observation });

  } catch (error) {
    console.error('Create observation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET - Get observations for lead
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const observations = await prisma.observation.findMany({
      where: { leadId: id },
      include: {
        user: {
          select: { id: true, name: true }
        }
      },
      orderBy: { date: 'desc' }
    });

    return NextResponse.json({ observations });

  } catch (error) {
    console.error('Get observations error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
