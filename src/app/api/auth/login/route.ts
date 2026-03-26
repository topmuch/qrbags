import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { createSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const { email, password, role } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    // Rechercher l'utilisateur
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { agency: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Identifiants incorrects' },
        { status: 401 }
      );
    }

    // Vérifier le mot de passe
    const isValidPassword = user.password ? await bcrypt.compare(password, user.password) : false;
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Identifiants incorrects' },
        { status: 401 }
      );
    }

    // Vérifier le rôle
    if (role === 'admin' && user.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Accès non autorisé - Administrateur requis' },
        { status: 403 }
      );
    }

    if (role === 'agency' && user.role !== 'agency' && user.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Accès non autorisé - Agence requise' },
        { status: 403 }
      );
    }

    // Créer une session
    await createSession(user.id);

    // Retourner les infos utilisateur
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        agencyId: user.agencyId,
        agency: user.agency,
      },
      redirectUrl: user.role === 'superadmin' ? '/admin/tableau-de-bord' : '/agence/tableau-de-bord',
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
