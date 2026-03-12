import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Default settings
const defaultSettings = {
  // Company Info
  company_name: 'QRBag',
  company_address: 'Poissy, France',
  company_phone: '+33 7 45 34 93 39',
  company_email: 'contact@qrbag.com',
  company_logo: '',
  // SEO
  seo_title: 'QRBag - Protection intelligente des bagages',
  seo_description: 'Protégez vos bagages avec un autocollant QR intelligent. Sans application, sans batterie, sans GPS.',
  seo_keywords: 'QR, bagage, voyage, hajj, protection, sticker',
  seo_image: '',
  // Localization
  languages: 'fr,en,ar',
  default_language: 'fr',
  currency: 'EUR',
};

// GET - Get all settings
export async function GET() {
  try {
    const settings = await db.setting.findMany();
    
    // Convert to object
    const settingsMap: Record<string, string> = {};
    for (const setting of settings) {
      settingsMap[setting.key] = setting.value;
    }

    // Merge with defaults
    const result = { ...defaultSettings, ...settingsMap };

    return NextResponse.json({ settings: result });

  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { settings } = body;

    // Update each setting
    for (const [key, value] of Object.entries(settings)) {
      await db.setting.upsert({
        where: { key },
        create: { key, value: String(value) },
        update: { value: String(value) }
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
