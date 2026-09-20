import { db } from '@/lib/db';

/**
 * ✈️ EMAIL POST-VOYAGE — 48 h après le départ.
 *
 * Envoie au voyageur un e-mail « tout s'est bien passé ? » et lui rappelle
 * que sa checkliste de voyage gratuite et les QR codes QRBags sont
 * disponibles sur qrbags.com pour son prochain voyage.
 *
 * Anti-doublon : le champ Baggage.postTripEmailSentAt (null → envoyé puis
 * horodaté). Si l'envoi échoue, le champ reste null → retenté au prochain passage.
 * Sécurité : bagages 'lost' / 'blocked' exclus (demander « tout s'est bien
 * passé ? » à un voyageur dont le bagage est perdu serait déplacé).
 */

const DELAY_MS = 48 * 60 * 60 * 1000; // 48 h

const TRANSPORT_LABELS: Record<string, string> = {
  flight: 'en avion',
  train: 'en train',
  boat: 'en bateau',
  bus: 'en bus',
};

function getBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://qrbags.com'
  );
}

export interface PostTripResult {
  processed: number;
  sent: number;
  failed: number;
  errors: string[];
}

/**
 * Traite un lot de bagages dont le départ date de plus de 48 h.
 * Appelé par /api/cron/post-trip (cron externe) et par l'horloge interne
 * de src/instrumentation.ts.
 */
export async function sendPostTripEmails(batchSize = 20): Promise<PostTripResult> {
  const result: PostTripResult = { processed: 0, sent: 0, failed: 0, errors: [] };

  const cutoff = new Date(Date.now() - DELAY_MS);

  const due = await db.baggage.findMany({
    where: {
      postTripEmailSentAt: null,
      departureDate: { not: null, lte: cutoff },
      travelerEmail: { not: null },
      status: { in: ['active', 'scanned', 'found'] },
    },
    select: {
      id: true,
      reference: true,
      travelerFirstName: true,
      travelerLastName: true,
      travelerEmail: true,
      destination: true,
      departureDate: true,
      departureTime: true,
      transportMode: true,
    },
    take: batchSize,
    orderBy: { departureDate: 'asc' },
  });

  if (due.length === 0) return result;

  const { sendEmail, getEmailSettings, getPostTripEmailTemplate, getDestinationFlag } = await import('@/lib/email');
  const emailSettings = await getEmailSettings();
  if (!emailSettings) {
    result.errors.push('Config e-mail indisponible (EmailSettings)');
    return result;
  }

  const baseUrl = getBaseUrl();
  const checklistUrl = `${baseUrl}/checklist`;

  for (const bag of due) {
    result.processed += 1;
    const email = bag.travelerEmail?.trim() || '';
    if (!email || !email.includes('@')) {
      // Pas d'e-mail exploitable : marquer quand même pour ne pas retraiter
      await db.baggage.update({
        where: { id: bag.id },
        data: { postTripEmailSentAt: new Date() },
      }).catch(() => {});
      continue;
    }

    try {
      const firstName = (bag.travelerFirstName || bag.travelerLastName || 'voyageur').trim();
      const departureDate = bag.departureDate
        ? new Date(bag.departureDate).toLocaleDateString('fr-FR', { dateStyle: 'long' })
        : '';
      const transportLabel = TRANSPORT_LABELS[bag.transportMode] || undefined;

      // AVIS-FEATURE : le CTA « Partager mon avis » pointe vers l'onglet Avis
      // (/avis) avec la référence bagage pré-remplie — l'avis est publié
      // immédiatement, sans compte.
      const feedbackUrl = `${baseUrl}/avis?ref=${encodeURIComponent(bag.reference)}`;

      const template = getPostTripEmailTemplate({
        firstName,
        reference: bag.reference,
        destination: bag.destination,
        departureDate,
        transportLabel,
        siteUrl: baseUrl,
        checklistUrl,
        feedbackUrl,
      });

      const res = await sendEmail({
        to: email,
        subject: `${getDestinationFlag(bag.destination)} Votre voyage${bag.destination ? ` vers ${bag.destination}` : ''} — tout s'est bien passé ?`,
        html: template.html,
        text: template.text,
        type: 'post_trip_feedback',
        data: { reference: bag.reference },
      });

      if (res.success) {
        await db.baggage.update({
          where: { id: bag.id },
          data: { postTripEmailSentAt: new Date() },
        });
        result.sent += 1;
      } else {
        result.failed += 1;
        result.errors.push(`${bag.reference}: ${res.error || 'échec envoi'}`);
      }
    } catch (err) {
      result.failed += 1;
      result.errors.push(`${bag.reference}: ${err instanceof Error ? err.message : 'erreur inconnue'}`);
    }
  }

  return result;
}
