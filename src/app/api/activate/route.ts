import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateExpirationDate } from '@/lib/qr';
import { z } from 'zod';
import { readPhotoFromDisk } from '@/lib/photo-storage';
import { rateLimit } from '@/lib/rate-limit';
import { sendEmail, getDocsEmailTemplate } from '@/lib/email';

// Validation schema for activation
const activateSchema = z.object({
  reference: z.string().min(1, 'Reference is required'),
  travelerFirstName: z.string().min(1, 'First name is required'),
  travelerLastName: z.string().min(1, 'Last name is required'),
  whatsappOwner: z.string().min(1, 'WhatsApp number is required'),
  // 🔔 NOTIFICATION : email du voyageur pour l'alerte « bagage scanné » (optionnel)
  travelerEmail: z.union([z.string().email(), z.literal('')]).optional(),
  airlineName: z.string().optional(),
  flightNumber: z.string().optional(),
  destination: z.string().optional(),
  departureDate: z.string().date().optional(),
  departureTime: z.string().optional(),
  // PHOTO + REWARD FEATURE: photo de la valise + récompense en cas de perte
  photoPath: z.string().max(500).optional(),
  reward: z.string().max(120).optional(),
  // TRANSPORT-FEATURE: Multi-transport mode support
  transportMode: z.enum(['flight', 'train', 'boat', 'bus']).optional(),
  trainCompany: z.string().optional(),
  trainNumber: z.string().optional(),
  shipName: z.string().optional(),
  shipCabin: z.string().optional(),
  busCompany: z.string().optional(),
  busLineNumber: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 🔒 Anti spam/énumération de références : 20 activations / min / IP
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
    if (rateLimit(`activate:${clientIp}`, { windowMs: 60_000, maxRequests: 20 })) {
      return NextResponse.json(
        { error: 'Trop de requêtes. Réessayez dans une minute.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validatedData = activateSchema.parse(body);

    // Find the baggage by reference
    const baggage = await db.baggage.findUnique({
      where: { reference: validatedData.reference },
      include: { agency: true }
    });

    if (!baggage) {
      return NextResponse.json(
        { error: 'Baggage not found', message: 'Code QR non valide' },
        { status: 404 }
      );
    }

    if (baggage.status !== 'pending_activation') {
      return NextResponse.json(
        { error: 'Already activated', message: 'Ce bagage a déjà été activé' },
        { status: 400 }
      );
    }

    // Determine subtype for expiration calculation
    const subtype = baggage.type === 'voyageur' ? 'sticker' : undefined;

    // Calculate expiration date
    const expiresAt = calculateExpirationDate(baggage.type as 'hajj' | 'voyageur', subtype);

    // PHOTO-STORAGE : la photo est copiée en base (BLOB) pour survivre aux
    // redéploiements (le disque du conteneur est éphémère). Le fichier disque
    // n'est plus qu'un cache de staging — la source de vérité est la DB.
    let photoBlob: { data: Buffer; mime: string; size: number } | null = null;
    if (validatedData.photoPath) {
      photoBlob = await readPhotoFromDisk(validatedData.photoPath);
      if (!photoBlob) {
        console.warn(`[ACTIVATE] Photo introuvable sur disque pour ${baggage.reference} : ${validatedData.photoPath}`);
      }
    }

    // Update baggage with traveler info
    const updatedBaggage = await db.baggage.update({
      where: { id: baggage.id },
      data: {
        travelerFirstName: validatedData.travelerFirstName,
        travelerLastName: validatedData.travelerLastName,
        travelerEmail: validatedData.travelerEmail?.trim() || null,
        whatsappOwner: validatedData.whatsappOwner,
        airlineName: validatedData.airlineName || null,
        flightNumber: validatedData.flightNumber || null,
        destination: validatedData.destination || null,
        departureDate: validatedData.departureDate ? new Date(validatedData.departureDate + 'T00:00:00') : null,
        departureTime: validatedData.departureTime || null,
        // TRANSPORT-FEATURE: Store transport mode + conditional fields
        transportMode: validatedData.transportMode || 'flight',
        trainCompany: validatedData.trainCompany || null,
        trainNumber: validatedData.trainNumber || null,
        shipName: validatedData.shipName || null,
        shipCabin: validatedData.shipCabin || null,
        busCompany: validatedData.busCompany || null,
        busLineNumber: validatedData.busLineNumber || null,
        // PHOTO + REWARD FEATURE (photo stockée en DB — durable)
        photoPath: validatedData.photoPath || null,
        photoData: photoBlob?.data ?? null,
        photoMime: photoBlob?.mime ?? null,
        photoSizeBytes: photoBlob?.size ?? null,
        reward: validatedData.reward?.trim() || null,
        status: 'active',
        activatedAt: new Date(), // tri « dernier activé en premier » côté agence
        expiresAt,
      }
    });

    // ─── Activation groupée (Hajj & Voyageur) ───
    // Un voyageur peut posséder plusieurs QR codes générés ensemble (même `setId`).
    // Dès qu'un QR est activé, tous les autres QR du même set en attente
    // d'activation sont activés automatiquement avec les mêmes informations.
    let activatedReferences: string[] = [updatedBaggage.reference];

    if (baggage.setId) {
      const relatedBaggages = await db.baggage.findMany({
        where: {
          setId: baggage.setId,
          status: 'pending_activation'
        }
      });

      for (const related of relatedBaggages) {
        if (related.id !== baggage.id) {
          await db.baggage.update({
            where: { id: related.id },
            data: {
              travelerFirstName: validatedData.travelerFirstName,
              travelerLastName: validatedData.travelerLastName,
              travelerEmail: validatedData.travelerEmail?.trim() || null,
              whatsappOwner: validatedData.whatsappOwner,
              departureDate: validatedData.departureDate ? new Date(validatedData.departureDate + 'T00:00:00') : null,
              departureTime: validatedData.departureTime || null,
              airlineName: validatedData.airlineName || null,
              flightNumber: validatedData.flightNumber || null,
              destination: validatedData.destination || null,
              // Même mode de transport que le QR activé (même voyageur, même voyage)
              transportMode: validatedData.transportMode || 'flight',
              trainCompany: validatedData.trainCompany || null,
              trainNumber: validatedData.trainNumber || null,
              shipName: validatedData.shipName || null,
              shipCabin: validatedData.shipCabin || null,
              busCompany: validatedData.busCompany || null,
              busLineNumber: validatedData.busLineNumber || null,
              // PHOTO + REWARD FEATURE (copiés vers tout le set, photo stockée en DB)
              photoPath: validatedData.photoPath || null,
              photoData: photoBlob?.data ?? null,
              photoMime: photoBlob?.mime ?? null,
              photoSizeBytes: photoBlob?.size ?? null,
              reward: validatedData.reward?.trim() || null,
              status: 'active',
              activatedAt: new Date(), // même horodatage d'activation pour tout le set
              expiresAt,
            }
          });
          activatedReferences.push(related.reference);
        }
      }

      if (activatedReferences.length > 1) {
        console.log(`[ACTIVATE] Activation groupée (${baggage.type}) du set ${baggage.setId}: ${activatedReferences.join(', ')}`);
      }
    }

    // ─── 📧 Envoi automatique des documents (Passeport + lien de suivi) ───
    // Si l'email voyageur est renseigné à l'inscription, le passager reçoit
    // immédiatement ses documents SANS avoir à les redemander sur /success.
    // Fire-and-forget : ne ralentit ni ne fait échouer l'activation si le SMTP
    // est indisponible — la page /success reste un filet de sécurité (re-envoi).
    const autoDocsEmail = validatedData.travelerEmail?.trim().toLowerCase();
    if (autoDocsEmail) {
      // URLs construites côté serveur (headers de la requête, jamais le body — anti-phishing)
      const protocol = request.headers.get('x-forwarded-proto') || 'http';
      const host = request.headers.get('host') || 'qrbags.com';
      const baseUrl = `${protocol}://${host}`;

      const travelerName = [validatedData.travelerFirstName, validatedData.travelerLastName]
        .filter(Boolean)
        .join(' ')
        .trim();

      const expiresLabel = expiresAt
        ? new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(expiresAt)
        : undefined;

      const docsTemplate = getDocsEmailTemplate({
        reference: updatedBaggage.reference,
        travelerName,
        passportUrl: `${baseUrl}/passeport/${updatedBaggage.reference}`,
        trackingUrl: `${baseUrl}/suivi/${updatedBaggage.reference}`,
        expiresLabel,
      });

      void sendEmail({
        to: autoDocsEmail,
        subject: `🧳 Vos documents QRBags — bagage ${updatedBaggage.reference}`,
        html: docsTemplate.html,
        text: docsTemplate.text,
        type: 'success_docs',
        data: { reference: updatedBaggage.reference },
      })
        .then((result) => {
          if (result.success) {
            console.log(`[ACTIVATE] 📧 Documents auto-envoyés : ${updatedBaggage.reference} → ${autoDocsEmail}`);
          } else {
            console.error(`[ACTIVATE] Échec envoi auto documents ${updatedBaggage.reference} :`, result.error);
          }
        })
        .catch((err) => {
          console.error(`[ACTIVATE] Erreur envoi auto documents ${updatedBaggage.reference} :`, err);
        });
    }

    return NextResponse.json({
      success: true,
      baggage: {
        id: updatedBaggage.id,
        reference: updatedBaggage.reference,
        type: updatedBaggage.type,
        status: updatedBaggage.status,
        expiresAt: updatedBaggage.expiresAt,
        setId: updatedBaggage.setId,
      },
      // Nombre total de QR activés (principal + liés) pour feedback UI
      activatedCount: activatedReferences.length,
      activatedReferences,
    });

  } catch (error) {
    console.error('Activation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
