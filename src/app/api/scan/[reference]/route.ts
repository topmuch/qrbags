import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateWhatsAppMessage } from '@/lib/groq';
import { logMetric } from '@/lib/logger';

// GET - Retrieve baggage info for scan page
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;

    const baggage = await db.baggage.findUnique({
      where: { reference },
      include: { agency: true }
    });

    if (!baggage) {
      return NextResponse.json({
        status: 'not_found',
        message: 'Code QR non valide',
        theme: 'error'
      });
    }

    // Check status - redirect to activation if pending
    if (baggage.status === 'pending_activation') {
      return NextResponse.json({
        status: 'pending_activation',
        type: baggage.type, // Important: return type for redirect
        message: 'Ce bagage doit être activé',
        theme: baggage.type === 'hajj' ? 'hajj' : 'voyageur'
      });
    }

    if (baggage.status === 'blocked') {
      return NextResponse.json({
        status: 'blocked',
        message: 'Ce bagage a été bloqué',
        theme: 'error'
      });
    }

    // Check expiration
    if (baggage.expiresAt && new Date() > baggage.expiresAt) {
      return NextResponse.json({
        status: 'expired',
        message: 'Ce bagage a expiré',
        theme: 'error',
        expiredAt: baggage.expiresAt.toISOString(),
        agency: baggage.agency?.name || null,
        baggage: {
          type: baggage.type,
          travelerName: `${baggage.travelerFirstName} ${baggage.travelerLastName}`
        }
      });
    }

    // Check if baggage is declared lost (but not yet found)
    const isDeclaredLost = baggage.declaredLostAt && !baggage.foundAt;

    // Return baggage info
    let theme;
    if (isDeclaredLost) {
      theme = 'lost-urgent'; // Special theme for declared lost baggage
    } else {
      theme = baggage.type === 'hajj'
        ? (baggage.status === 'lost' ? 'lost-hajj' : 'hajj')
        : (baggage.status === 'lost' ? 'lost-voyageur' : 'voyageur');
    }

    return NextResponse.json({
      status: isDeclaredLost ? 'lost' : 'active',
      theme,
      type: baggage.type,
      baggage: {
        reference: baggage.reference,
        type: baggage.type,
        travelerName: `${baggage.travelerFirstName} ${baggage.travelerLastName}`,
        baggageIndex: baggage.baggageIndex,
        baggageType: baggage.baggageType,
        status: baggage.status,
        flightNumber: baggage.flightNumber,
        destination: baggage.destination,
        agency: baggage.agency?.name || null,
        whatsappOwner: baggage.whatsappOwner || null,
        declaredLostAt: baggage.declaredLostAt,
        foundAt: baggage.foundAt,
        createdAt: baggage.createdAt?.toISOString() || null,
        departureDate: baggage.departureDate?.toISOString() || null,
        departureTime: baggage.departureTime || null,
      }
    });

  } catch (error) {
    console.error('Scan error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Log scan and generate WhatsApp link
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;
    const body = await request.json();

    const { location, finderName, finderPhone, message, latitude, longitude, country, city, ipAddress } = body;

    const baggage = await db.baggage.findUnique({
      where: { reference }
    });

    if (!baggage || !baggage.whatsappOwner) {
      return NextResponse.json(
        { error: 'Baggage not found or not activated' },
        { status: 404 }
      );
    }

    // ─── IA: Générer le message WhatsApp via Groq (si activé) ───
    let aiMessageContent: string | null = null;
    let aiGenerated = false;
    let aiLatencyMs: number | null = null;

    try {
      // Vérifier si le feature flag groq_api est activé en DB
      const groqFlag = await db.featureFlag.findUnique({
        where: { key: 'groq_api' },
        select: { enabled: true },
      });

      if (groqFlag?.enabled) {
        const scanTime = new Date().toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        });

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://qrbags.com';

        const aiResult = await generateWhatsAppMessage({
          reference: baggage.reference,
          location: {
            city: city || baggage.destination || 'Inconnue',
            country: country || '',
          },
          time: scanTime,
          link: `${appUrl}/suivi/${baggage.reference}`,
          language: 'fr',
        });

        if (aiResult.generated && aiResult.message) {
          aiMessageContent = aiResult.message;
          aiGenerated = true;
          aiLatencyMs = aiResult.latencyMs;
          logMetric('groq', 'generate_message', aiResult.latencyMs, true, {
            key: baggage.reference,
          });
        } else {
          logMetric('groq', 'generate_message', aiResult.latencyMs, false, {
            key: baggage.reference,
            details: 'fallback',
          });
        }
      }
    } catch (error) {
      // Ne bloque JAMAIS le flux de scan — fallback silencieux
      logMetric('groq', 'generate_message', 0, false, {
        key: baggage.reference,
        details: error instanceof Error ? error.message : 'unknown',
      });
    }

    // Create scan log with AI tracking
    await db.scanLog.create({
      data: {
        baggageId: baggage.id,
        location,
        message,
        latitude,
        longitude,
        country,
        city,
        ipAddress,
        aiMessageUsed: aiGenerated,
        groqLatencyMs: aiLatencyMs,
      }
    });

    // Check if baggage is declared lost (urgent case)
    const isDeclaredLost = baggage.declaredLostAt && !baggage.foundAt;

    // Update baggage with last scan info and founder information
    const updateData: Record<string, unknown> = {
      lastScanDate: new Date(),
      lastLocation: location,
      status: baggage.status === 'active' ? 'scanned' : baggage.status,
    };

    // Store founder information if provided
    if (finderName && finderName.trim()) {
      updateData.founderName = finderName.trim();
      updateData.founderAt = new Date();
    }
    
    if (finderPhone && finderPhone.trim()) {
      updateData.founderPhone = finderPhone.trim();
    }

    // If baggage was declared lost and founder provides info, this is an important recovery step
    // Keep the 'lost' status until agency confirms recovery

    await db.baggage.update({
      where: { id: baggage.id },
      data: updateData
    });

    // Generate WhatsApp message — use AI message if available, else static
    let whatsappText: string;

    if (aiMessageContent) {
      // Message généré par IA — ajouter les infos du trouveur
      const finderText = finderName ? `\n👤 Trouvé par: ${finderName}` : '';
      const finderPhoneText = finderPhone ? `\n📱 Contact: ${finderPhone}` : '';
      const locationText = latitude && longitude
        ? `\n📍 Position: https://www.google.com/maps?q=${latitude},${longitude}`
        : location ? `\n📍 Lieu: ${location}` : '';
      const messageText = message ? `\n💬 ${message}` : '';

      whatsappText = `${aiMessageContent}${finderText}${finderPhoneText}${locationText}${messageText}`;
    } else {
      // Message statique (fallback — logique existante préservée)
      const locationText = latitude && longitude
        ? `📍 Position: https://www.google.com/maps?q=${latitude},${longitude}`
        : location ? `📍 Lieu: ${location}` : '';
      const finderText = finderName ? `👤 Trouvé par: ${finderName}` : '';
      const finderPhoneText = finderPhone ? `📱 Contact: ${finderPhone}` : '';
      const messageText = message ? `💬 Message: ${message}` : '';

      const urgencyPrefix = isDeclaredLost
        ? '🚨 URGENT - Bagage perdu retrouvé !'
        : '🔍 QRBag - Bagage trouvé !';

      whatsappText = `${urgencyPrefix}\n\n📦 Référence: ${reference}\n${locationText}\n${finderText}\n${finderPhoneText}\n${messageText}\n\nMerci de contacter la personne qui a trouvé votre bagage.`;
    }

    // Clean phone number
    const phone = baggage.whatsappOwner.replace(/[^0-9]/g, '');
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(whatsappText)}`;

    return NextResponse.json({
      success: true,
      whatsappUrl,
      isDeclaredLost,
      aiMessageUsed: aiGenerated,
    });

  } catch (error) {
    console.error('Scan POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
