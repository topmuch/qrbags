/**
 * API Route — Démo réelle QRBag
 *
 * GET    /api/demo          → état du bagage démo + journal des scans (réels)
 * POST   /api/demo          → simule un scan trouveur (crée un vrai ScanLog, aucun WhatsApp réel envoyé)
 * DELETE /api/demo          → réinitialise la démo (supprime les scans, remet le bagage à l'état initial)
 *
 * Le bagage démo (référence DEMO-QRBAG) est un vrai bagage en base :
 * le QR affiché est scannable et ouvre la vraie page /scan/DEMO-QRBAG.
 * Garde-fou : les références commençant par "DEMO" n'envoient jamais
 * de message WhatsApp réel (voir /api/scan/notify).
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const DEMO_REFERENCE = 'DEMO-QRBAG';

const DEMO_BAGGAGE_DATA = {
  reference: DEMO_REFERENCE,
  type: 'voyageur',
  travelerFirstName: 'Ahmed',
  travelerLastName: 'Diallo',
  whatsappOwner: '+33700000000', // numéro factice — aucun message réel
  baggageIndex: 2,
  baggageType: 'soute',
  transportMode: 'flight',
  airlineName: 'Air France',
  flightNumber: 'AF 726',
  destination: 'Dakar (AIBD)',
  reward: '50 €', // mise en valeur de la récompense sur la page trouveur
};

// Lieux proposés pour la simulation de scan
const DEMO_LOCATIONS = [
  'Aéroport Paris-CDG (France)',
  'Aéroport Dakar-AIBD (Sénégal)',
  'Aéroport Casablanca-Mohammed V (Maroc)',
  'Aéroport Dubaï International (Émirats)',
  'Gare de Lyon (Paris)',
  'Aéroport Istanbul (Turquie)',
];

const SCAN_SELECT = {
  id: true,
  location: true,
  city: true,
  country: true,
  message: true,
  finderName: true,
  finderPhone: true,
  whatsappStatus: true,
  createdAt: true,
} as const;

/** Crée (ou répare) le bagage démo et renvoie son état complet */
async function ensureDemoBaggage() {
  let baggage = await db.baggage.findUnique({
    where: { reference: DEMO_REFERENCE },
  });

  if (!baggage) {
    baggage = await db.baggage.create({
      data: {
        ...DEMO_BAGGAGE_DATA,
        status: 'active',
      },
    });
  } else if (
    baggage.status === 'pending_activation' ||
    baggage.status === 'blocked' ||
    !baggage.reward
  ) {
    // Garantit que le bagage démo reste utilisable + récompense toujours présente
    baggage = await db.baggage.update({
      where: { reference: DEMO_REFERENCE },
      data: {
        status: 'active',
        ...( !baggage.reward && { reward: DEMO_BAGGAGE_DATA.reward }),
      },
    });
  }

  const scans = await db.scanLog.findMany({
    where: { baggageId: baggage.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: SCAN_SELECT,
  });

  return { baggage, scans };
}

/** Aperçu du message WhatsApp que le propriétaire recevrait */
function buildWhatsappPreview(location: string, finderName?: string, finderPhone?: string, message?: string) {
  const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://qrbags.com';

  let msg = [
    `✈️ Alerte QRBag`,
    `Votre bagage ${DEMO_REFERENCE} (vol) a été scanné à ${location} à ${now}.`,
    `Suivez son statut : ${appUrl}/suivi/${DEMO_REFERENCE}`,
  ].join('\n');

  const finderParts: string[] = [];
  if (finderName) finderParts.push(`👤 Trouvé par : ${finderName}`);
  if (finderPhone) finderParts.push(`📱 Contact : ${finderPhone}`);
  if (message) finderParts.push(`💬 ${message}`);
  if (finderParts.length > 0) msg += '\n' + finderParts.join('\n');

  return msg;
}

// ═══════════════════════════════════════════════════════
//  GET — État de la démo
// ═══════════════════════════════════════════════════════

export async function GET() {
  try {
    const { baggage, scans } = await ensureDemoBaggage();

    return NextResponse.json({
      success: true,
      bag: {
        reference: baggage.reference,
        status: baggage.status,
        travelerName: `${baggage.travelerFirstName || ''} ${baggage.travelerLastName || ''}`.trim() || 'Voyageur démo',
        airlineName: baggage.airlineName,
        flightNumber: baggage.flightNumber,
        destination: baggage.destination,
        baggageType: baggage.baggageType,
        lastScanDate: baggage.lastScanDate,
        lastLocation: baggage.lastLocation,
      },
      scans,
      locations: DEMO_LOCATIONS,
    });
  } catch (error) {
    console.error('[Demo API] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Impossible de charger la démo.' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════
//  POST — Simuler un scan trouveur (vrai ScanLog, zéro WhatsApp réel)
// ═══════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const data = body as {
      location?: string;
      finderName?: string;
      finderPhone?: string;
      message?: string;
    };

    const location = (data.location || DEMO_LOCATIONS[0]).trim().slice(0, 120);
    const finderName = data.finderName?.trim().slice(0, 60) || 'Trouveur anonyme';
    const finderPhone = data.finderPhone?.trim().slice(0, 30) || undefined;
    const message = data.message?.trim().slice(0, 300) || undefined;

    const { baggage } = await ensureDemoBaggage();

    // Création du VRAI ScanLog (visible côté suivi + admin)
    await db.scanLog.create({
      data: {
        baggageId: baggage.id,
        location,
        city: location,
        message: [finderName, finderPhone, message].filter(Boolean).join(' — ') || null,
        finderName,
        finderPhone,
        context: 'demo',
        whatsappStatus: 'demo', // jamais "sent" : aucun message réel n'est envoyé
      },
    });

    await db.baggage.update({
      where: { id: baggage.id },
      data: {
        status: 'scanned',
        lastScanDate: new Date(),
        lastLocation: location,
        founderName: finderName,
        founderPhone: finderPhone ?? null,
        founderAt: new Date(),
      },
    });

    const whatsappMessage = buildWhatsappPreview(location, finderName, finderPhone, message);

    // Renvoie l'état à jour
    const scans = await db.scanLog.findMany({
      where: { baggageId: baggage.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: SCAN_SELECT,
    });

    return NextResponse.json({
      success: true,
      whatsappMessage,
      scans,
      bag: {
        reference: baggage.reference,
        status: 'scanned',
        lastLocation: location,
        lastScanDate: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[Demo API] POST error:', error);
    return NextResponse.json(
      { success: false, error: 'La simulation du scan a échoué.' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════
//  DELETE — Réinitialiser la démo
// ═══════════════════════════════════════════════════════

export async function DELETE() {
  try {
    const { baggage } = await ensureDemoBaggage();

    // Supprime tous les scans du bagage démo
    await db.scanLog.deleteMany({
      where: { baggageId: baggage.id },
    });

    // Remet le bagage à l'état initial propre
    await db.baggage.update({
      where: { id: baggage.id },
      data: {
        status: 'active',
        lastScanDate: null,
        lastLocation: null,
        founderName: null,
        founderPhone: null,
        founderAt: null,
        foundAt: null,
        declaredLostAt: null,
      },
    });

    return NextResponse.json({ success: true, scans: [] });
  } catch (error) {
    console.error('[Demo API] DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'La réinitialisation a échoué.' },
      { status: 500 }
    );
  }
}
