import { NextRequest, NextResponse } from 'next/server';
import { existsSync } from 'fs';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { readPhotoFromDisk, safePhotoAbsolutePath, PHOTO_MIME_BY_EXT } from '@/lib/photo-storage';

// PHOTO-FEATURE: Sert la photo de la valise au navigateur (page trouveur /scan).
// La référence QR agit comme jeton d'accès (même modèle que les données du bagage).
//
// Ordre de lecture : 1) BLOB en base (source de vérité — survit aux redéploiements),
// 2) fallback fichier disque (ancien stockage) avec migration automatique vers la DB
// pour que la photo ne casse pas au prochain redéploiement.
//
// ✅ COMPATIBILITÉ TROUVEUR : les photos HEIC/HEIF (format natif caméra iPhone) ne
// s'affichent PAS dans Chrome/Firefox (seul Safari iOS les décode). Pour GARANTIR que
// la photo s'affiche sur la page trouveur quel que soit le navigateur, tout format
// HEIC/HEIF est converti à la volée en JPEG (sharp/libvips préinstallé) avant envoi.

/** Formats que les navigateurs trouveurs ne savent pas tous afficher → conversion JPEG */
function needsBrowserSafeConversion(mime: string): boolean {
  const m = (mime || '').toLowerCase();
  return m.includes('heic') || m.includes('heif');
}

/**
 * Détecte un conteneur HEIC/HEIF par magic bytes (boîte ftyp + brand).
 * Utile quand photoMime est absent en DB mais que les octets sont du HEIC —
 * sans cela, le trouveur recevrait un binaire « image/jpeg » menti et illisible.
 */
function isHeicBinary(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 12) return false;
  if (buffer.toString('ascii', 4, 8) !== 'ftyp') return false;
  const brand = buffer.toString('ascii', 8, 12).toLowerCase();
  return ['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1', 'heif', 'heim', 'heis', 'hevm', 'hevs'].includes(brand);
}

/** Convertit un buffer HEIC/HEIF en JPEG universellement affichable. Retourne null si échec. */
async function toBrowserSafeJpeg(
  data: Buffer
): Promise<{ data: Buffer; mime: string } | null> {
  try {
    const sharp = (await import('sharp')).default;
    const jpeg = await sharp(data, { failOn: 'none' })
      .rotate() // respecte l'orientation EXIF (photos téléphone tournées)
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer();
    if (jpeg && jpeg.length > 0) return { data: jpeg, mime: 'image/jpeg' };
    return null;
  } catch (err) {
    console.warn('[baggage-photo] Conversion HEIC→JPEG impossible, envoi du binaire original:', err instanceof Error ? err.message : err);
    return null;
  }
}
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
      let buffer = Buffer.from(baggage.photoData);
      let contentType = baggage.photoMime || 'image/jpeg';

      // HEIC/HEIF (iPhone) → JPEG : garantit l'affichage chez le trouveur quel que soit le navigateur
      // (détection par MIME DB ET par magic bytes — photoMime peut être absent)
      if (needsBrowserSafeConversion(contentType) || isHeicBinary(buffer)) {
        const converted = await toBrowserSafeJpeg(buffer);
        if (converted) {
          buffer = converted.data;
          contentType = converted.mime;
        }
      }

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

        // HEIC/HEIF (déduit du MIME, de l'extension disque ou des magic bytes) → JPEG pour le trouveur
        let buffer = blob.data;
        let contentType = blob.mime || PHOTO_MIME_BY_EXT[baggage.photoPath.split('.').pop()?.toLowerCase() || ''] || 'image/jpeg';
        if (needsBrowserSafeConversion(contentType) || isHeicBinary(buffer)) {
          const converted = await toBrowserSafeJpeg(buffer);
          if (converted) {
            buffer = converted.data;
            contentType = converted.mime;
          }
        }

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
