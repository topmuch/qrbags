import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET - Seed admin user (ONLY works in development or with setup token)
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

    // Dynamic import to avoid build issues
    const { PrismaClient } = await import('@prisma/client');
    const bcrypt = await import('bcryptjs');

    const prisma = new PrismaClient();

    // Check if admin exists
    const existing = await prisma.user.findUnique({
      where: { email: 'admin@qrbag.com' }
    });

    if (existing) {
      await prisma.$disconnect();
      return NextResponse.json({
        success: true,
        message: 'Admin existe déjà'
      });
    }

    // Create admin with credentials from environment or default
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@qrbag.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminName = process.env.ADMIN_NAME || 'SuperAdmin';

    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        id: 'admin-' + Date.now(),
        email: adminEmail,
        name: adminName,
        password: hashedPassword,
        role: 'superadmin',
      }
    });

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      message: 'Admin créé avec succès'
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
