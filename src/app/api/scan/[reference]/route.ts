import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateCuid } from '@/lib/qr';

// Baggage row type for raw queries
interface BaggageRow {
  id: string;
  reference: string;
  type: string;
  setId: string | null;
  agencyId: string | null;
  travelerFirstName: string | null;
  travelerLastName: string | null;
  whatsappOwner: string | null;
  baggageIndex: number;
  baggageType: string;
  status: string;
  flightNumber: string | null;
  destination: string | null;
  createdAt: string;
  expiresAt: string | null;
  lastScanDate: string | null;
  lastLocation: string | null;
  declaredLostAt: string | null;
  foundAt: string | null;
  founderName: string | null;
  founderPhone: string | null;
}

// Agency row type
interface AgencyRow {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
}

// GET - Retrieve baggage info for scan page
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;

    // Get baggage using raw SQL
    const baggageRows = await db.$queryRaw<BaggageRow[]>`
      SELECT
        id, reference, type, setId, agencyId,
        travelerFirstName, travelerLastName, whatsappOwner,
        baggageIndex, baggageType, status,
        flightNumber, destination, createdAt, expiresAt,
        lastScanDate, lastLocation, declaredLostAt, foundAt,
        founderName, founderPhone
      FROM Baggage
      WHERE reference = ${reference}
      LIMIT 1
    `;

    if (!baggageRows || baggageRows.length === 0) {
      return NextResponse.json({
        status: 'not_found',
        message: 'Code QR non valide',
        theme: 'error'
      });
    }

    const baggage = baggageRows[0];

    // Get agency info if exists
    let agency: AgencyRow | null = null;
    if (baggage.agencyId) {
      const agencyRows = await db.$queryRaw<AgencyRow[]>`
        SELECT id, name, slug, email, phone
        FROM Agency
        WHERE id = ${baggage.agencyId}
        LIMIT 1
      `;
      agency = agencyRows && agencyRows.length > 0 ? agencyRows[0] : null;
    }

    // Check status - redirect to activation if pending
    if (baggage.status === 'pending_activation') {
      return NextResponse.json({
        status: 'pending_activation',
        type: baggage.type,
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
    if (baggage.expiresAt && new Date() > new Date(baggage.expiresAt)) {
      return NextResponse.json({
        status: 'expired',
        message: 'Ce bagage a expiré',
        theme: 'error',
        expiredAt: baggage.expiresAt,
        agency: agency?.name || null,
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
      theme = 'lost-urgent';
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
        agency: agency?.name || null,
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

    // Get baggage using raw SQL
    const baggageRows = await db.$queryRaw<BaggageRow[]>`
      SELECT
        id, reference, type, agencyId,
        travelerFirstName, travelerLastName, whatsappOwner,
        baggageIndex, baggageType, status,
        createdAt, expiresAt, declaredLostAt, foundAt
      FROM Baggage
      WHERE reference = ${reference}
      LIMIT 1
    `;

    if (!baggageRows || baggageRows.length === 0) {
      return NextResponse.json(
        { error: 'Baggage not found or not activated' },
        { status: 404 }
      );
    }

    const baggage = baggageRows[0];

    if (!baggage.whatsappOwner) {
      return NextResponse.json(
        { error: 'Baggage not activated' },
        { status: 400 }
      );
    }

    // Create scan log using raw SQL
    const scanLogId = generateCuid();
    const now = new Date().toISOString();

    await db.$executeRaw`
      INSERT INTO ScanLog (
        id, baggageId, location, message,
        latitude, longitude, country, city, ipAddress, createdAt
      ) VALUES (
        ${scanLogId}, ${baggage.id}, ${location || null}, ${message || null},
        ${latitude || null}, ${longitude || null}, ${country || null}, ${city || null},
        ${ipAddress || null}, ${now}
      )
    `;

    // Check if baggage is declared lost (urgent case)
    const isDeclaredLost = baggage.declaredLostAt && !baggage.foundAt;

    // Determine new status
    let newStatus = baggage.status;
    if (baggage.status === 'active') {
      newStatus = 'scanned';
    }

    // Update baggage with last scan info and founder information
    const founderAt = (finderName && finderName.trim()) ? now : null;

    await db.$executeRaw`
      UPDATE Baggage SET
        lastScanDate = ${now},
        lastLocation = ${location || null},
        status = ${newStatus},
        founderName = ${finderName?.trim() || null},
        founderPhone = ${finderPhone?.trim() || null},
        founderAt = ${founderAt}
      WHERE id = ${baggage.id}
    `;

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
