import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// Initialize demo users for login (ONLY works in development or with setup token)
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

    // Check if superadmin exists
    const existingAdmin = await db.user.findFirst({
      where: { role: 'superadmin' }
    });

    if (existingAdmin) {
      return NextResponse.json({
        success: true,
        message: 'Demo users already exist'
      });
    }

    // Get credentials from environment or use defaults
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@qrbag.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const agencyEmail = process.env.AGENCY_EMAIL || 'agence@qrbag.com';
    const agencyPassword = process.env.AGENCY_PASSWORD || 'agence123';

    // Hash passwords
    const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
    const hashedAgencyPassword = await bcrypt.hash(agencyPassword, 10);

    // Create demo agency first
    const demoAgency = await db.agency.create({
      data: {
        name: 'FRANCINE MAKELA',
        slug: 'francine-makela',
        email: 'contact@francine-makela.com',
        phone: '+221 77 123 45 67',
        address: 'Dakar, Sénégal',
        active: true,
      }
    });

    // Create superadmin user
    await db.user.create({
      data: {
        email: adminEmail,
        name: 'Super Admin',
        password: hashedAdminPassword,
        role: 'superadmin',
      }
    });

    // Create demo agency user
    await db.user.create({
      data: {
        email: agencyEmail,
        name: 'FRANCINE MAKELA',
        password: hashedAgencyPassword,
        role: 'agency',
        agencyId: demoAgency.id,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Demo users created successfully'
    });
  } catch (error) {
    console.error('Init error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to initialize demo users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
