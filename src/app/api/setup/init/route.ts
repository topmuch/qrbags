import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// GET - Initialize admin user (ONLY works in development or with setup token)
export async function GET(request: Request) {
  try {
    // Security: Only allow in development or with a valid setup token
    const url = new URL(request.url);
    const setupToken = url.searchParams.get('token');
    const expectedToken = process.env.SETUP_TOKEN;

    // Block in production unless a valid setup token is provided
    if (process.env.NODE_ENV === 'production') {
      if (!expectedToken || setupToken !== expectedToken) {
        return NextResponse.json({
          success: false,
          error: 'Non autorisé. Cette endpoint est désactivé en production.'
        }, { status: 403 });
      }
    }

    // Check if superadmin already exists
    const existingAdmin = await db.user.findFirst({
      where: { role: 'superadmin' }
    });

    if (existingAdmin) {
      return NextResponse.json({
        success: true,
        message: 'Un administrateur existe déjà'
      });
    }

    // Create superadmin user with credentials from environment or default
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@qrbag.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminName = process.env.ADMIN_NAME || 'SuperAdmin';

    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    const admin = await db.user.create({
      data: {
        email: adminEmail,
        name: adminName,
        password: hashedPassword,
        role: 'superadmin',
      }
    });

    // Create default settings if they don't exist
    const settings = [
      { key: 'company_name', value: 'QRBag' },
      { key: 'company_address', value: 'Poissy, France' },
      { key: 'company_phone', value: '+33 7 45 34 93 39' },
      { key: 'company_email', value: 'contact@qrbag.com' },
      { key: 'seo_title', value: 'QRBag - Protection intelligente des bagages' },
      { key: 'seo_description', value: 'Protégez vos bagages avec un autocollant QR intelligent. Sans application, sans batterie, sans GPS.' },
    ];

    for (const setting of settings) {
      await db.setting.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: setting,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Administrateur créé avec succès'
    });

  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 });
  }
}
