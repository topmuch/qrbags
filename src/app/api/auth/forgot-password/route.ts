import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createEmailToken, sendEmail, getPasswordResetEmailTemplate } from '@/lib/email';
import { checkRateLimit, getClientIp, RATE_LIMITS, getRateLimitHeaders } from '@/lib/rate-limit';

// POST - Request password reset
export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const ip = getClientIp(request.headers);
    const rateLimitKey = `forgot-password:${ip}`;
    const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMITS.forgotPassword);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: rateLimitResult.message },
        { 
          status: 429,
          headers: getRateLimitHeaders(rateLimitResult)
        }
      );
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email requis' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { email }
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ 
        success: true, 
        message: 'Si un compte existe, un email de réinitialisation a été envoyé' 
      });
    }

    // Create reset token
    const { token, code } = await createEmailToken(email, 'password_reset');
    
    // Build reset URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;
    
    // Send reset email
    const template = getPasswordResetEmailTemplate(
      user.name || 'Utilisateur',
      resetUrl,
      code
    );
    
    await sendEmail({
      to: email,
      subject: 'QRBag - Réinitialisation de votre mot de passe',
      html: template.html,
      text: template.text,
      type: 'password_reset',
      userId: user.id
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Si un compte existe, un email de réinitialisation a été envoyé' 
    });
  } catch (error) {
    console.error('Error requesting password reset:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi de l\'email' },
      { status: 500 }
    );
  }
}
