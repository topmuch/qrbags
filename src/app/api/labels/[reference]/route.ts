import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import QRCode from 'qrcode';
import sharp from 'sharp';

// ─── Géométrie du design d'étiquette (source 1049×1499 = 7×10 cm à ~381 DPI) ───
const LABEL_WIDTH = 1049;
const LABEL_HEIGHT = 1499;
// Carte blanche centrale : x [228, 828], y [705, 1225] — équerres colorées sur les bords
const QR_SIZE = 370;
const QR_X = Math.round(LABEL_WIDTH / 2 - QR_SIZE / 2); // 340 — centré horizontalement
const QR_Y = 780;                                        // entre les équerres hautes (745) et basses (1185)
const REF_TEXT_Y = QR_Y + QR_SIZE + 34;                  // référence sous le QR, dans la carte
const REF_FONT_SIZE = 30;
const REF_COLOR = '#1e2a5e';

// Fond du design (une image par type ; voyageur fourni, hajj à venir)
const LABEL_BACKGROUNDS: Record<string, string> = {
  voyageur: 'public/labels/qrbag-voyageur.png',
  hajj: 'public/labels/qrbag-voyageur.png', // design voyageur utilisé en attendant le design hajj
};

/**
 * GET /api/labels/[reference][?download=1]
 * Génère l'étiquette bagage imprimable (7×10 cm) : design QRBag + QR code + référence.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;
    const ref = decodeURIComponent(reference).toUpperCase();

    const baggage = await db.baggage.findUnique({
      where: { reference: ref },
      select: { reference: true, type: true },
    });

    if (!baggage) {
      return NextResponse.json(
        { error: 'Baggage not found', message: 'Code QR non valide' },
        { status: 404 }
      );
    }

    // URL scannée par le QR (origine de la requête → fonctionne en dev comme en prod)
    const origin = process.env.NEXT_PUBLIC_BASE_URL || new URL(request.url).origin;
    const scanUrl = `${origin}/scan/${baggage.reference}`;

    // 1. QR code rendu en 2× puis réduit (modules nets, sans flou)
    const qrPng = await QRCode.toBuffer(scanUrl, {
      width: QR_SIZE * 2,
      margin: 0,
      errorCorrectionLevel: 'H',
      color: { dark: '#111a4d', light: '#ffffff' },
    });
    const qrResized = await sharp(qrPng)
      .resize(QR_SIZE, QR_SIZE, { kernel: 'nearest' })
      .png()
      .toBuffer();

    // 2. Référence bagage (texte vectoriel sous le QR)
    const refSvg = `<svg width="${LABEL_WIDTH}" height="${LABEL_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <text x="${LABEL_WIDTH / 2}" y="${REF_TEXT_Y}" text-anchor="middle"
        font-family="DejaVu Sans, Arial, sans-serif" font-weight="bold"
        font-size="${REF_FONT_SIZE}" fill="${REF_COLOR}" letter-spacing="2">${baggage.reference}</text>
    </svg>`;

    // 3. Composition : fond design + QR + référence
    const background = LABEL_BACKGROUNDS[baggage.type] || LABEL_BACKGROUNDS.voyageur;
    const label = await sharp(background)
      .composite([
        { input: qrResized, left: QR_X, top: QR_Y },
        { input: Buffer.from(refSvg), left: 0, top: 0 },
      ])
      .png({ compressionLevel: 9 })
      .toBuffer();

    const download = new URL(request.url).searchParams.get('download') === '1';
    const filename = `etiquette-qrbag-${baggage.reference}.png`;

    return new NextResponse(new Uint8Array(label), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store',
        'Content-Disposition': download
          ? `attachment; filename="${filename}"`
          : `inline; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Label generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Erreur lors de la génération de l\'étiquette' },
      { status: 500 }
    );
  }
}
