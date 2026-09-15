import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateChecklistPdf, buildPublicChecklistUrl, type ChecklistItem } from '@/lib/checklist';
import { rateLimit } from '@/lib/rate-limit';

/**
 * GET /api/checklist/[code]/pdf?key=XXX
 *
 * Streams the PDF attestation. Requires the verification key.
 * PDF is generated on-demand (no on-disk persistence) for portability.
 *
 * Headers:
 *   Content-Type: application/pdf
 *   Content-Disposition: inline; filename="QRBags-attestation-{code}.pdf"
 *   Cache-Control: no-store
 */
/**
 * Branded HTML error page — this route is always opened in a browser tab
 * (window.open / direct link), so errors must be human-friendly HTML,
 * never raw JSON.
 */
function pdfErrorPage(title: string, message: string, showCta: boolean) {
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
*{box-sizing:border-box}
body{font-family:system-ui,-apple-system,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:linear-gradient(135deg,#16234e 0%,#1d2f6b 100%);color:#fff;padding:1.25rem}
.box{background:#fff;color:#16234e;border-radius:24px;padding:2.5rem 2rem;max-width:420px;width:100%;text-align:center;box-shadow:0 24px 60px rgba(0,0,0,.35)}
.badge{display:inline-flex;align-items:center;gap:.5rem;background:#16234e;color:#ffd200;font-weight:800;font-size:.8rem;letter-spacing:.12em;padding:.45rem 1rem;border-radius:999px;margin-bottom:1.25rem}
.icon{font-size:3rem;margin-bottom:.75rem}
h2{margin:0 0 .5rem;font-size:1.3rem;font-weight:800}
p{margin:0 0 1.25rem;font-size:.92rem;color:#475569;line-height:1.5}
a.btn{display:inline-block;background:linear-gradient(90deg,#2f9bff,#8b17c9);color:#fff;text-decoration:none;font-weight:700;font-size:.95rem;padding:.85rem 1.6rem;border-radius:999px;box-shadow:0 8px 20px rgba(47,155,255,.35)}
.hint{margin-top:1rem;font-size:.75rem;color:#94a3b8}
</style></head>
<body><div class="box">
<div class="badge">QR·BAG</div>
<div class="icon">🧳</div>
<h2>${title}</h2>
<p>${message}</p>
${showCta ? '<a class="btn" href="/checklist">Créer une nouvelle checklist</a>' : '<a class="btn" href="/checklist">Retour à la checklist</a>'}
<p class="hint">Besoin d'aide ? contact@qrbags.com</p>
</div></body></html>`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const url = new URL(request.url);
    const providedKey = url.searchParams.get('key')?.trim();

    if (!providedKey) {
      return new NextResponse(
        pdfErrorPage('Clé de vérification requise', "La clé de vérification est manquante. Utilisez le lien complet reçu par email ou affiché à la création de votre checklist.", false),
        { status: 401, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    // ─── Rate limit PDF downloads: 20 / hour / IP ───
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip')?.trim() ||
      'unknown';
    if (rateLimit(`checklist-pdf:${code}:${clientIp}`, { windowMs: 60 * 60 * 1000, maxRequests: 20 })) {
      return new NextResponse(
        pdfErrorPage('Trop de téléchargements', 'Vous avez atteint la limite de téléchargements horaires. Réessayez dans une heure.', false),
        { status: 429, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    const checklist = await db.checklist.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!checklist) {
      return new NextResponse(
        pdfErrorPage('Attestation introuvable', `Aucune checklist n\u2019existe pour le code « ${code.toUpperCase().replace(/</g, '&lt;')} ». Elle a peut-\u00eatre \u00e9t\u00e9 supprim\u00e9e lors d\u2019une maintenance. Cr\u00e9ez une nouvelle checklist en moins d\u2019une minute.`, true),
        { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    if (providedKey !== checklist.verificationKey) {
      return new NextResponse(
        pdfErrorPage('Clé de vérification incorrecte', "La clé fournie ne correspond pas à cette attestation. Vérifiez le lien ou la clé reçue par email.", false),
        { status: 403, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    // ─── Parse items ───
    let parsedItems: ChecklistItem[] = [];
    try {
      const parsed = JSON.parse(checklist.items);
      if (Array.isArray(parsed)) {
        parsedItems = parsed.filter(
          (it): it is ChecklistItem =>
            typeof it === 'object' && it !== null &&
            typeof it.category === 'string' && typeof it.name === 'string'
        );
      }
    } catch {
      // ignore
    }

    // ─── Build public URL for QR code in PDF ───
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('host') || 'qrbags.com';
    const publicUrl = buildPublicChecklistUrl(checklist.code, `${protocol}://${host}`);

    // ─── Generate PDF ───
    const pdfBuffer = await generateChecklistPdf({
      code: checklist.code,
      verificationKey: checklist.verificationKey,
      firstName: checklist.firstName,
      lastName: checklist.lastName,
      email: checklist.email,
      departureDate: checklist.departureDate,
      destinationCountry: checklist.destinationCountry,
      airline: checklist.airline,
      flightNumber: checklist.flightNumber,
      items: parsedItems,
      publicUrl,
      createdAt: checklist.createdAt,
    });

    // ─── Stream as response ───
    const filename = `QRBags-attestation-${checklist.code}.pdf`;
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Content-Length': String(pdfBuffer.length),
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    const fullStack = error instanceof Error ? error.stack : '';
    console.error('[checklist/[code]/pdf] GET error:', fullStack || error);
    const msg = error instanceof Error ? error.message : 'Erreur inconnue';

    return new NextResponse(
      pdfErrorPage('Erreur de génération du PDF', `La génération du document a échoué : ${msg.replace(/</g, '&lt;')}. Veuillez réessayer.`, false),
      { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}
