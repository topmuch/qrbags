import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { rateLimit } from '@/lib/rate-limit';
import { writePhotoToDisk, PHOTO_MAX_BYTES } from '@/lib/photo-storage';

// PHOTO-FEATURE: Upload de la photo de la valise (page /inscrire)
// Le fichier est écrit sur disque (staging) ; il est copié en base (BLOB) au
// moment de l'activation (voir src/lib/photo-storage.ts) pour survivre aux
// redéploiements. Servie ensuite via /api/baggage-photo/[reference].
//
// ⚠️ Cette route avait été supprimée accidentellement (commit de reset df1d138)
// alors que le client l'appelle → « Échec de l'envoi de la photo » systématique.
// Restaurée avec en plus le support HEIC/HEIF (photos iPhone natives).
const MAX_FILE_SIZE = PHOTO_MAX_BYTES; // 10 Mo
const ALLOWED_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'image/heic', 'image/heif', // photos iPhone (format natif caméra)
]);
const ALLOWED_EXTS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif']);

export async function POST(request: NextRequest) {
  try {
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip')?.trim() ||
      'unknown';
    if (rateLimit(`baggage-photo-upload:${clientIp}`, { windowMs: 60 * 60 * 1000, maxRequests: 15 })) {
      return NextResponse.json({ error: 'Trop de téléchargements. Réessayez plus tard.' }, { status: 429 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 });
    }

    // Certains navigateurs téléphones envoient un type vide (fichier sans mime)
    // → on tolère en se fiant à l'extension, rejetée si inconnue.
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const safeExt = ALLOWED_EXTS.has(ext) ? ext : null;
    const lowerType = file.type?.toLowerCase() || '';
    const typeOk = !lowerType || ALLOWED_TYPES.has(lowerType);
    if (!typeOk || (!safeExt && !lowerType)) {
      return NextResponse.json(
        { error: 'Type de fichier non supporté (JPG, PNG, WEBP, GIF, HEIC)' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Fichier trop volumineux (max 10 Mo)' }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json({ error: 'Fichier vide' }, { status: 400 });
    }

    const filename = `${randomUUID()}.${safeExt || 'jpg'}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const relativePath = await writePhotoToDisk('baggage-photos', filename, buffer);

    return NextResponse.json({
      success: true,
      photoPath: relativePath,
      photoSizeBytes: buffer.length,
    });
  } catch (error) {
    console.error('[baggage-photo/upload] POST error:', error);
    const msg = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json({ error: 'Erreur serveur lors du téléchargement', details: msg }, { status: 500 });
  }
}
