import { NextRequest, NextResponse } from 'next/server';
import { stat } from 'fs/promises';
import { existsSync } from 'fs';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { readPhotoFromDisk, safePhotoAbsolutePath } from '@/lib/photo-storage';

// PHOTO-FEATURE: Sert la photo de la valise au navigateur (page trouveur /scan).
// La référence QR agit comme jeton d'accès (même modèle que les données du bagage).
//
// Ordre de lecture : 1) BLOB en base (source de vérité — survit aux redéploiements),
// 2) fallback fichier disque (ancien stockage) avec migration automatique vers la DB
// pour que la photo ne casse pas au prochain redéploiement.
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
      select: { reference: true, photoPath: true, photoData: true, photoMime: true, photoSizeBytes: true },
    });

    if (!baggage) {
      return NextResponse.json({ error: 'Aucune photo associée' }, { status: 404 });
    }

    // 1) Source de vérité : photo stockée en base (durable, survit aux redéploiements)
    if (baggage.photoData && baggage.photoData.length > 0) {
      const buffer = Buffer.from(baggage.photoData);
      const contentType = baggage.photoMime || 'image/jpeg';
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Length': String(buffer.length),
          'Content-Disposition': `inline; filename="photo-valise-${baggage.reference}"`,
          'Cache-Control': 'private, max-age=3600',
        },
      });
    }

    // 2) Fallback legacy : fichier disque (photoPath) + migration automatique vers la DB
    if (baggage.photoPath) {
      const blob = await readPhotoFromDisk(baggage.photoPath);
      if (blob) {
        // Migration en arrière-plan (best-effort) : la prochaine lecture viendra de la DB
        void db.baggage.update({
          where: { reference: baggage.reference },
          data: { photoData: blob.data, photoMime: blob.mime, photoSizeBytes: blob.size },
        }).catch((err) => console.warn('[baggage-photo/[reference]] migration BLOB échouée:', err));

        const absolutePath = safePhotoAbsolutePath(baggage.photoPath);
        const fileStat = await stat(absolutePath);
        return new NextResponse(new Uint8Array(blob.data), {
          status: 200,
          headers: {
            'Content-Type': blob.mime,
            'Content-Length': String(fileStat.size),
            'Content-Disposition': `inline; filename="photo-valise-${baggage.reference}"`,
            'Cache-Control': 'private, max-age=3600',
          },
        });
      }

      // Fichier disque absent (conteneur recréé) mais photoPath en DB → log de diagnostic
      const absolutePath = safePhotoAbsolutePath(baggage.photoPath);
      if (!existsSync(absolutePath)) {
        console.error(`[baggage-photo/[reference]] Fichier disque introuvable pour ${baggage.reference}: ${baggage.photoPath} (photoData vide en DB)`);
      }
    }

    return NextResponse.json({ error: 'Aucune photo associée' }, { status: 404 });
  } catch (error) {
    console.error('[baggage-photo/[reference]] GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
