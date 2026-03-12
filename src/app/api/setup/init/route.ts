import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// This endpoint initializes the database with a superadmin user
// It should only work if no superadmin exists yet (security measure)
export async function POST(request: NextRequest) {
  try {
    // Check if any superadmin already exists
    const existingSuperAdmin = await db.user.findFirst({
      where: { role: 'superadmin' }
    });

    if (existingSuperAdmin) {
      return NextResponse.json(
        { error: 'Un SuperAdmin existe déjà. Initialisation non autorisée.' },
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

    // Create default settings if they don't exist
    const defaultSettings = [
      { key: 'company_name', value: 'QRBag' },
      { key: 'company_address', value: 'Poissy, France' },
      { key: 'company_phone', value: '+33 7 45 34 93 39' },
      { key: 'company_email', value: 'contact@qrbag.com' },
      { key: 'seo_title', value: 'QRBag - Protection intelligente des bagages' },
      { key: 'seo_description', value: 'Protégez vos bagages avec un autocollant QR intelligent. Sans application, sans batterie, sans GPS.' },
      { key: 'languages', value: 'fr,en,ar' },
      { key: 'default_language', value: 'fr' },
      { key: 'currency', value: 'EUR' },
    ];

    for (const setting of defaultSettings) {
      await db.setting.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: setting,
      });
    }

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
    console.error('Setup error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'initialisation: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// GET - Check if setup is needed
export async function GET() {
  try {
    const superAdminCount = await db.user.count({
      where: { role: 'superadmin' }
    });

    return NextResponse.json({
      needsSetup: superAdminCount === 0,
      superAdminCount
    });
  } catch (error) {
    console.error('Check setup error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification' },
      { status: 500 }
    );
  }
}
