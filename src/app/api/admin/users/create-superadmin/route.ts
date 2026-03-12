import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// This endpoint allows creating additional superadmins
// Security: Only works if at least one superadmin already exists
// This prevents unauthorized access while allowing legitimate admin creation
export async function POST(request: NextRequest) {
  try {
    // Security check: At least one superadmin must exist
    const existingSuperAdmin = await db.user.findFirst({
      where: { role: 'superadmin' }
    });

    if (!existingSuperAdmin) {
      return NextResponse.json(
        { error: 'Aucun SuperAdmin existant. Utilisez /api/setup/init pour le premier compte.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, password, name } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Un utilisateur avec cet email existe déjà' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create superadmin
    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || 'SuperAdmin',
        role: 'superadmin',
      }
    });

    return NextResponse.json({
      success: true,
      message: 'SuperAdmin créé avec succès',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Create superadmin error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
