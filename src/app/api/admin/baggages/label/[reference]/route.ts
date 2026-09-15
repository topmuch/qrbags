import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateQrLabelPng, generateQrLabelPdf } from '@/lib/qr-label';

/**
 * GET /api/admin/baggages/label/[reference]
 *
 * Télécharge l'étiquette QR print-ready (design QRBags intégré, 7 × 10 cm)
 * pour une référence de bagage donnée.
 *
 * Query params :
 *   - format : 'png' (défaut) | 'pdf'
 *     - png : image lossless ~381 DPI, métadonnées pHYs → imprime à 7 × 10 cm
 *     - pdf : page PDF de exactement 7 × 10 cm (recommandé pour l'impression)
 *   - preview : '1' → affiche l'image au lieu de la télécharger (inline)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> },
) {
  try {
    const { reference: rawReference } = await params;
    const reference = decodeURIComponent(rawReference).toUpperCase();

    const baggage = await db.baggage.findUnique({
      where: { reference },
      select: { reference: true, type: true },
    });

    if (!baggage) {
      return NextResponse.json(
        { error: 'Baggage introuvable' },
        { status: 404 },
      );
    }

    // URL de scan absolue (même logique que l'export ZIP)
    const protocol = request.headers.get('x-forwarded-proto') || request.nextUrl.protocol.replace(':', '');
    const host = request.headers.get('host') || request.nextUrl.host;
    const baseUrl = `${protocol}://${host}`;
    const scanUrl = `${baseUrl}/scan/${baggage.reference}`;

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') === 'pdf' ? 'pdf' : 'png';
    const inline = searchParams.get('preview') === '1';

    const filename = `ETIQUETTE-7x10cm-${baggage.reference}.${format}`;
    const disposition = inline ? 'inline' : 'attachment';

    if (format === 'pdf') {
      const pdf = await generateQrLabelPdf({ reference: baggage.reference, scanUrl });
      return new NextResponse(new Uint8Array(pdf), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `${disposition}; filename="${filename}"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    const png = await generateQrLabelPng({ reference: baggage.reference, scanUrl });
    return new NextResponse(new Uint8Array(png), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `${disposition}; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[LABEL] Error generating label:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération de l\'étiquette' },
      { status: 500 },
    );
  }
}
