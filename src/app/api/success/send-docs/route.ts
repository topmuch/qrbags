import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { sendEmail, getDocsEmailTemplate } from '@/lib/email';
import { rateLimit } from '@/lib/rate-limit';

/**
 * POST /api/success/send-docs
 *
 * Page de confirmation d'inscription (/success) — envoie par email :
 *   1. le lien du Passeport bagage (/passeport/{reference})
 *   2. le lien de suivi en temps réel (/suivi/{reference})
 *
 * Body : { reference: string, email: string }
 * Effet secondaire : met à jour Baggage.travelerEmail si nécessaire
 * (active aussi les notifications « bagage scanné » pour ce voyageur).
 *
 * Les URLs sont construites côté serveur à partir des headers de la requête
 * (jamais depuis le body — anti-phishing).
 */

const sendDocsSchema = z.object({
  reference: z.string().trim().min(4).max(32),
  email: z.string().trim().email().max(255),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = sendDocsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Référence ou email invalide' },
        { status: 400 }
      );
    }

    const { reference, email } = parsed.data;

    // Rate limit : 5 envois / minute / email (anti-abus)
    if (rateLimit(`send-docs:${email.toLowerCase()}`, { windowMs: 60_000, maxRequests: 5 })) {
      return NextResponse.json(
        { error: 'Trop de demandes. Réessayez dans une minute.' },
        { status: 429 }
      );
    }

    // ─── Baggage lookup (case-insensitive) ───
    const baggage = await db.baggage.findFirst({
      where: { reference: reference },
    });

    if (!baggage) {
      return NextResponse.json(
        { error: 'Bagage introuvable pour cette référence' },
        { status: 404 }
      );
    }

    // ─── URLs construites côté serveur (headers de la requête, jamais le body) ───
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'qrbags.com';
    const baseUrl = `${protocol}://${host}`;
    const passportUrl = `${baseUrl}/passeport/${baggage.reference}`;
    const trackingUrl = `${baseUrl}/suivi/${baggage.reference}`;

    // ─── Persister l'email voyageur (active les alertes scan futures) ───
    const normalizedEmail = email.toLowerCase();
    if (baggage.travelerEmail?.toLowerCase() !== normalizedEmail) {
      await db.baggage.update({
        where: { id: baggage.id },
        data: { travelerEmail: normalizedEmail },
      });
    }

    // ─── Email ───
    const travelerName = [baggage.travelerFirstName, baggage.travelerLastName]
      .filter(Boolean)
      .join(' ')
      .trim();

    const expiresLabel = baggage.expiresAt
      ? new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(baggage.expiresAt)
      : undefined;

    const template = getDocsEmailTemplate({
      reference: baggage.reference,
      travelerName,
      passportUrl,
      trackingUrl,
      expiresLabel,
    });

    const emailResult = await sendEmail({
      to: normalizedEmail,
      subject: `🧳 Vos documents QRBags — bagage ${baggage.reference}`,
      html: template.html,
      text: template.text,
      type: 'success_docs',
      data: { reference: baggage.reference },
    });

    if (!emailResult.success) {
      console.error('[send-docs] Email send failed:', emailResult.error);
      return NextResponse.json(
        { error: "Impossible d'envoyer l'email pour le moment" },
        { status: 502 }
      );
    }

    console.log(`[send-docs] ✓ Documents envoyés : ${baggage.reference} → ${normalizedEmail}`);

    return NextResponse.json({ success: true, emailSent: true });
  } catch (error) {
    console.error('[send-docs] POST error:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
