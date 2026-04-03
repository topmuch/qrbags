import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { sendEmail, getWelcomeAgencyEmailTemplate, getEmailSettings } from '@/lib/email';
import { getSession } from '@/lib/session';

// Validation schema
const userSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  password: z.string().min(6),
  role: z.enum(['superadmin', 'admin', 'agent', 'agency']),
  agencyId: z.string().optional(),
  sendWelcomeEmail: z.boolean().optional(), // Optional: send welcome email
  agencyName: z.string().optional(), // For welcome email
});

// Password hashing with bcrypt (compatible with login API)
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// GET - List all users (SuperAdmin only)
export async function GET() {
  try {
    // Authentication check
    const user = await getSession();
    if (!user || user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const users = await db.user.findMany({
      include: { agency: true },
      orderBy: { createdAt: 'desc' }
    });

    // Remove passwords from response
    const safeUsers = users.map(({ password, ...user }) => user);

    return NextResponse.json({ users: safeUsers });

  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new user (SuperAdmin only)
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const authUser = await getSession();
    if (!authUser || authUser.role !== 'superadmin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = userSchema.parse(body);

    // Check if email already exists
    const existing = await db.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(validatedData.password);
    const user = await db.user.create({
      data: {
        email: validatedData.email,
        name: validatedData.name || null,
        password: hashedPassword,
        role: validatedData.role,
        agencyId: validatedData.agencyId || null,
      }
    });

    // Send welcome email for agency users
    if (validatedData.role === 'agency' && validatedData.sendWelcomeEmail !== false) {
      try {
        const emailSettings = await getEmailSettings();
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const loginUrl = `${baseUrl}/agence/connexion`;
        
        const template = getWelcomeAgencyEmailTemplate(
          validatedData.agencyName || validatedData.name || 'Agence',
          validatedData.email,
          validatedData.password,
          loginUrl
        );
        
        await sendEmail({
          to: validatedData.email,
          subject: '🎉 Bienvenue sur QRBag - Votre espace agence',
          html: template.html,
          text: template.text,
          type: 'welcome',
          userId: user.id,
          agencyId: validatedData.agencyId
        });
        
        console.log('✅ Welcome email sent to:', validatedData.email);
      } catch (emailError) {
        console.error('❌ Failed to send welcome email:', emailError);
        // Don't fail the request if email fails
      }
    }

    // Remove password from response
    const { password, ...safeUser } = user;

    return NextResponse.json({ user: safeUser });

  } catch (error) {
    console.error('Create user error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update user (SuperAdmin only)
export async function PUT(request: NextRequest) {
  try {
    // Authentication check
    const authUser = await getSession();
    if (!authUser || authUser.role !== 'superadmin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { id, password, ...data } = body;

    const updateData: Record<string, unknown> = { ...data };
    
    if (password) {
      updateData.password = await hashPassword(password);
    }

    const user = await db.user.update({
      where: { id },
      data: updateData
    });

    const { password: _, ...safeUser } = user;

    return NextResponse.json({ user: safeUser });

  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete user (SuperAdmin only)
export async function DELETE(request: NextRequest) {
  try {
    // Authentication check
    const authUser = await getSession();
    if (!authUser || authUser.role !== 'superadmin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    await db.user.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
