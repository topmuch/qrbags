import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getEmailSettings, sendEmail, updateTestStatus, getTestEmailTemplate } from '@/lib/email';

// POST - Send test email
export async function POST(request: NextRequest) {
  try {
    const user = await getSession();

    if (!user || !['superadmin', 'admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await request.json();
    const { testEmail } = body;

    if (!testEmail) {
      return NextResponse.json({ error: 'Adresse email de test requise' }, { status: 400 });
    }

    // Get email settings
    const config = await getEmailSettings();
    if (!config) {
      return NextResponse.json({ error: 'Configuration email non trouvée' }, { status: 400 });
    }

    // Check if SMTP is configured when provider is smtp
    if (config.provider === 'smtp') {
      if (!config.smtpHost || !config.smtpPort) {
        return NextResponse.json({ error: 'Configuration SMTP incomplète (hôte ou port manquant)' }, { status: 400 });
      }
      if (!config.smtpUser || !config.smtpPassword) {
        return NextResponse.json({ error: 'Configuration SMTP incomplète (utilisateur ou mot de passe manquant)' }, { status: 400 });
      }
    }

    // Get test email template
    const template = getTestEmailTemplate();

    // Send test email
    const result = await sendEmail({
      to: testEmail,
      subject: '🧪 QRBag - Email de test',
      html: template.html,
      text: template.text,
      type: 'test',
    });

    // Update test status
    await updateTestStatus(result.success, result.error);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Email de test envoyé avec succès à ${testEmail}`,
        provider: config.provider,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Erreur lors de l\'envoi de l\'email',
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi de l\'email de test: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
