import { NextRequest, NextResponse } from 'next/server';
import { stat } from 'fs/promises';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { readPhotoFromDisk, safePhotoAbsolutePath } from '@/lib/photo-storage';
import { withChecklistSchemaRepair } from '@/lib/checklist-repair';

// PHOTO-FEATURE: Sert la photo de la checklist (attestation PDF / page checklist).
// Ordre de lecture : 1) BLOB en base (source de vérité — survit aux redéploiements),
// 2) fallback fichier disque (ancien stockage) avec migration automatique vers la DB.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const url = new URL(request.url);
    const providedKey = url.searchParams.get('key')?.trim();

    if (!providedKey) {
      return NextResponse.json({ error: 'Clé de vérification requise' }, { status: 401 });
    }

    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip')?.trim() ||
      'unknown';
    if (rateLimit(`checklist-photo:${code}:${clientIp}`, { windowMs: 60 * 60 * 1000, maxRequests: 30 })) {
      return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 });
    }

    const checklist = await withChecklistSchemaRepair(() => db.checklist.findUnique({
      where: { code: code.toUpperCase() },
      select: { code: true, verificationKey: true, photoPath: true, photoData: true, photoMime: true },
    }));

    if (!checklist) {
      return NextResponse.json({ error: 'Attestation introuvable' }, { status: 404 });
    }

    if (providedKey !== checklist.verificationKey) {
      return NextResponse.json({ error: 'Clé de vérification incorrecte' }, { status: 403 });
    }

    // 1) Source de vérité : photo stockée en base (durable, survit aux redéploiements)
    if (checklist.photoData && checklist.photoData.length > 0) {
      const buffer = Buffer.from(checklist.photoData);
      const contentType = checklist.photoMime || 'image/jpeg';
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Length': String(buffer.length),
          'Content-Disposition': `inline; filename="photo-valise-${checklist.code}"`,
          'Cache-Control': 'private, max-age=3600',
        },
      });
    }

    // 2) Fallback legacy : fichier disque (photoPath) + migration automatique vers la DB
    if (checklist.photoPath) {
      const blob = await readPhotoFromDisk(checklist.photoPath);
      if (blob) {
        // Migration en arrière-plan (best-effort) : la prochaine lecture viendra de la DB
        void db.checklist.update({
          where: { code: checklist.code },
          data: { photoData: blob.data, photoMime: blob.mime, photoSizeBytes: blob.size },
        }).catch((err) => console.warn('[checklist/[code]/photo] migration BLOB échouée:', err));

        const fileStat = await stat(safePhotoAbsolutePath(checklist.photoPath));
        return new NextResponse(new Uint8Array(blob.data), {
          status: 200,
          headers: {
            'Content-Type': blob.mime,
            'Content-Length': String(fileStat.size),
            'Content-Disposition': `inline; filename="photo-valise-${checklist.code}"`,
            'Cache-Control': 'private, max-age=3600',
          },
        });
      }
    }

    return NextResponse.json({ error: 'Aucune photo associée' }, { status: 404 });
  } catch (error) {
    console.error('[checklist/[code]/photo] GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
