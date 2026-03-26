import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function register() {
  // Only run on server startup
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('🚀 QRBag server starting...');

    try {
      // Create superadmin user if doesn't exist
      const existingAdmin = await db.user.findUnique({
        where: { email: 'admin@qrbag.com' }
      }).catch(() => null);

      if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash('admin123', 10);

        await db.user.create({
          data: {
            email: 'admin@qrbag.com',
            name: 'SuperAdmin',
            password: hashedPassword,
            role: 'superadmin',
          }
        }).catch(e => console.log('Admin creation skipped:', e.message));

        console.log('✅ Admin user created: admin@qrbag.com / admin123');
      } else {
        console.log('Admin user already exists');
      }

      // Create default settings
      const settings = [
        { key: 'company_name', value: 'QRBag' },
        { key: 'company_email', value: 'contact@qrbag.com' },
      ];

      for (const setting of settings) {
        await db.setting.upsert({
          where: { key: setting.key },
          update: {},
          create: setting,
        }).catch(() => {});
      }

      console.log('✅ Setup completed!');
    } catch (error) {
      console.log('Setup error (non-critical):', error);
    }
  }
}
