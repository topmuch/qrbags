import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyEmailToken, verifyEmailCode } from '@/lib/email';

// POST - Verify email with token or code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, code, email } = body;

    // Verify with token
    if (token) {
      const result = await verifyEmailToken(token, 'email_verification');
      
      if (!result.valid) {
        return NextResponse.json(
          { error: result.error || 'Token invalide ou expiré' },
          { status: 400 }
        );
      }

      // Update user's email verification status
      await db.user.update({
        where: { email: result.email },
        data: { emailVerified: new Date() }
      });

      const user = await db.user.findUnique({
        where: { email: result.email }
      });

      if (user) {
        return NextResponse.json({ 
          success: true, 
          message: 'Email vérifié avec succès',
          email: result.email 
        });
      } else {
        return NextResponse.json(
          { error: 'Utilisateur non trouvé' },
          { status: 404 }
        );
      }
    }

    // Verify with code
    if (code && email) {
      const result = await verifyEmailCode(code, email, 'email_verification');
      
      if (!result.valid) {
        return NextResponse.json(
          { error: result.error || 'Code invalide ou expiré' },
          { status: 400 }
        );
      }

      const normalizedEmail = email.toLowerCase().trim();
      const user = await db.user.findUnique({ where: { email: normalizedEmail } });
      if (user) {
        await db.user.update({
          where: { email: normalizedEmail },
          data: { emailVerified: new Date() }
        });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Email vérifié avec succès' 
      });
    }

    return NextResponse.json(
      { error: 'Token ou code requis' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error verifying email:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification' },
      { status: 500 }
    );
  }
}
