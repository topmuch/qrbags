import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

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

    // Create scan log
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

    // Generate WhatsApp message
    const locationText = latitude && longitude 
      ? `📍 Position: https://www.google.com/maps?q=${latitude},${longitude}`
      : location ? `📍 Lieu: ${location}` : '';

    const finderText = finderName ? `👤 Trouvé par: ${finderName}` : '';
    const finderPhoneText = finderPhone ? `📱 Contact: ${finderPhone}` : '';
    const messageText = message ? `💬 Message: ${message}` : '';

    let urgencyPrefix = '🔍 QRBag - Bagage trouvé !';
    if (isDeclaredLost) {
      urgencyPrefix = '🚨 URGENT - Bagage perdu retrouvé !';
    }

    const whatsappMessage = encodeURIComponent(
      `${urgencyPrefix}\n\n` +
      `📦 Référence: ${reference}\n` +
      `${locationText}\n` +
      `${finderText}\n` +
      `${finderPhoneText}\n` +
      `${messageText}\n\n` +
      `Merci de contacter la personne qui a trouvé votre bagage.`
    );

    // Clean phone number
    const phone = baggage.whatsappOwner.replace(/[^0-9]/g, '');
    const whatsappUrl = `https://wa.me/${phone}?text=${whatsappMessage}`;

    return NextResponse.json({
      success: true,
      whatsappUrl,
      isDeclaredLost
    });

  } catch (error) {
    console.error('Scan POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
