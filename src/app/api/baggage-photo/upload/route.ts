import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { rateLimit } from '@/lib/rate-limit';
import { PHOTO_MAX_BYTES, writePhotoToDisk } from '@/lib/photo-storage';

// PHOTO-FEATURE: Upload de la photo de la valise depuis la page d'activation (/inscrire).
// POST /api/baggage-photo/upload (multipart/form-data, champ « file »)
//
// La photo est mise en « staging » sur le disque (uploads/baggage-photos/) avec un
// nom unique ; elle est ensuite copiée en base (BLOB SQLite) au moment de
// l'activation (/api/activate) pour survivre aux redéploiements.
//
// ✅ Taille max : 30 Mo (PHOTO_MAX_BYTES) — photos haute résolution prises au
//    téléphone (capteurs 48-200 MP, HEIC iPhone, ProRAW…) ou insérées depuis
//    la galerie / l'explorateur de fichiers.
// Formats acceptés : JPG, JPEG, PNG, WEBP, GIF, HEIC, HEIF (caméra iPhone).
// Public par design (voir middleware : /api/baggage-photo) — rate-limité par IP.

const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif']);

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'image/heif': 'heif',
  // Certains téléphones Android / navigateurs envoient ces MIME pour du HEIC/HEIF
  'image/heif-sequence': 'heif',
  'image/heic-sequence': 'heic',
  // ⚠️ Les photos prises au téléphone ont souvent un MIME vide ou générique —
  // on se rabat alors sur l'extension du nom de fichier.
  'application/octet-stream': '',
};

export async function POST(request: NextRequest) {
  try {
    // 🔒 Anti spam : 20 uploads / heure / IP (retirer une photo + re-uploader doit rester possible)
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip')?.trim() ||
      'unknown';
    if (rateLimit(`baggage-photo-upload:${clientIp}`, { windowMs: 60 * 60 * 1000, maxRequests: 20 })) {
      return NextResponse.json({ error: 'Trop de téléchargements. Réessayez plus tard.' }, { status: 429 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json({ error: 'Fichier vide' }, { status: 400 });
    }

    // ✅ Taille : 30 Mo (photos haute résolution de téléphone acceptées)
    if (file.size > PHOTO_MAX_BYTES) {
      return NextResponse.json(
        { error: 'Fichier trop volumineux (max 30 Mo)' },
        { status: 400 }
      );
    }

    // Extension : depuis le nom de fichier, sinon déduite du MIME.
    // ⚠️ Sur mobile le MIME peut être vide (« application/octet-stream ») →
    // l'extension du nom de fichier est la source de vérité.
    const rawExt = file.name.split('.').pop()?.toLowerCase() || '';
    const extFromName = ALLOWED_EXTENSIONS.has(rawExt) ? rawExt : '';
    const extFromMime = EXT_BY_MIME[file.type.toLowerCase()] ?? '';
    const safeExt = extFromName || extFromMime;

    if (!safeExt) {
      return NextResponse.json(
        { error: 'Type de fichier non supporté (JPG, PNG, WEBP, GIF, HEIC)' },
        { status: 400 }
      );
    }

    // Garde-fou MIME : si le navigateur déclare un MIME connu qui n'est PAS une
    // image de la liste ci-dessus → rejet (évite de stocker un binaire arbitraire).
    if (file.type && !file.type.startsWith('image/') && file.type !== 'application/octet-stream') {
      return NextResponse.json(
        { error: 'Type de fichier non supporté (JPG, PNG, WEBP, GIF, HEIC)' },
        { status: 400 }
      );
    }

    const filename = `${randomUUID()}.${safeExt}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const relativePath = await writePhotoToDisk('baggage-photos', filename, buffer);

    console.log(`[baggage-photo/upload] Photo enregistrée : ${relativePath} (${buffer.length} octets, mime=${file.type || 'n/a'})`);

    return NextResponse.json({
      success: true,
      photoPath: relativePath,
      photoSizeBytes: buffer.length,
    });
  } catch (error) {
    console.error('[baggage-photo/upload] POST error:', error);
    const msg = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json(
      { error: 'Erreur serveur lors du téléchargement', details: msg },
      { status: 500 }
    );
  }
}
