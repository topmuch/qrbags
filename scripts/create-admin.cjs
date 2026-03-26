// Simple admin creation script for production
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Creating admin user...');

  try {
    // Check if admin exists
    const existing = await prisma.user.findUnique({
      where: { email: 'admin@qrbag.com' }
    });

    if (existing) {
      console.log('✅ Admin already exists:', existing.email);
      return;
    }

    // Create admin
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const user = await prisma.user.create({
      data: {
        id: 'admin-' + Date.now(),
        email: 'admin@qrbag.com',
        name: 'SuperAdmin',
        password: hashedPassword,
        role: 'superadmin',
      }
    });

    console.log('✅ Admin created:', user.email);
    console.log('📋 Login: admin@qrbag.com / admin123');
  } catch (error) {
    console.log('Note:', error.message);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());