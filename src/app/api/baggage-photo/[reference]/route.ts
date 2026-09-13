import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';

// PHOTO-FEATURE: Sert la photo de la valise au navigateur (page trouveur /scan).
// La référence QR agit comme jeton d'accès (même modèle que les données du bagage).
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;

    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip')?.trim() ||
      'unknown';
    if (rateLimit(`baggage-photo:${reference}:${clientIp}`, { windowMs: 60 * 60 * 1000, maxRequests: 60 })) {
      return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 });
    }

    const baggage = await db.baggage.findUnique({
      where: { reference: reference.toUpperCase() },
      select: { reference: true, photoPath: true },
    });

    if (!baggage || !baggage.photoPath) {
      return NextResponse.json({ error: 'Aucune photo associée' }, { status: 404 });
    }

    // Sécurité : le chemin stocké est généré côté serveur (UUID) — on neutralise toute traversée
    const safePath = baggage.photoPath.replace(/\.\./g, '').replace(/^\/+/, '');
    const absolutePath = join(process.cwd(), safePath);
    if (!existsSync(absolutePath)) {
      return NextResponse.json({ error: 'Fichier photo introuvable' }, { status: 404 });
    }

    const fileBuffer = await readFile(absolutePath);
    const fileStat = await stat(absolutePath);

    const ext = absolutePath.split('.').pop()?.toLowerCase();
    const contentType = ext === 'png' ? 'image/png'
      : ext === 'gif' ? 'image/gif'
      : ext === 'webp' ? 'image/webp'
      : 'image/jpeg';

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(fileStat.size),
        'Content-Disposition': `inline; filename="photo-valise-${baggage.reference}.${ext}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('[baggage-photo/[reference]] GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
