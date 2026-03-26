const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log('🌱 Starting seed...');

  // Create settings
  console.log('Creating settings...');
  const settings = [
    { key: 'company_name', value: 'QRBag' },
    { key: 'company_address', value: 'Poissy, France' },
    { key: 'company_phone', value: '+33 7 45 34 93 39' },
    { key: 'company_email', value: 'contact@qrbag.com' },
    { key: 'seo_title', value: 'QRBag - Protection intelligente des bagages' },
    { key: 'seo_description', value: 'Protégez vos bagages avec un autocollant QR intelligent.' },
  ];

  for (const setting of settings) {
    try {
      await prisma.setting.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: setting,
      });
    } catch (e) {
      console.log(`Setting ${setting.key} already exists`);
    }
  }

  // Create superadmin user
  console.log('Creating superadmin user...');
  try {
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@qrbag.com' }
    });

    if (!existingAdmin) {
      await prisma.user.create({
        data: {
          email: 'admin@qrbag.com',
          name: 'SuperAdmin',
          password: await hashPassword('admin123'),
          role: 'superadmin',
        }
      });
      console.log('✅ Admin user created: admin@qrbag.com / admin123');
    } else {
      console.log('Admin user already exists');
    }
  } catch (e) {
    console.log('Could not create admin user:', e.message);
  }

  console.log('✅ Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(0); // Don't fail the container
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
