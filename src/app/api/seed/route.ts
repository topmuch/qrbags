import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
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
        message: 'Admin exists',
        credentials: { email: 'admin@qrbag.com', password: 'admin123' }
      });
    }

    // Create admin
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        id: 'admin-' + Date.now(),
        email: 'admin@qrbag.com',
        name: 'SuperAdmin',
        password: hashedPassword,
        role: 'superadmin',
      }
    });

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      message: 'Admin created!',
      credentials: { email: 'admin@qrbag.com', password: 'admin123' }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
