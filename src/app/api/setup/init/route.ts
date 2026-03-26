import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    // Check if superadmin already exists
    const existingAdmin = await db.user.findUnique({
      where: { email: 'admin@qrbag.com' }
    });

    if (existingAdmin) {
      return NextResponse.json({
        success: true,
        message: 'Admin already exists',
        credentials: {
          email: 'admin@qrbag.com',
          password: 'admin123',
          role: 'superadmin'
        }
      });
    }

    // Create superadmin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await db.user.create({
      data: {
        email: 'admin@qrbag.com',
        name: 'SuperAdmin',
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
      message: 'Admin user created successfully!',
      credentials: {
        email: 'admin@qrbag.com',
        password: 'admin123',
        role: 'superadmin',
        loginUrl: 'https://qrbags.com/admin/connexion'
      }
    });

  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 });
  }
}
