import { readFile, mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

/**
 * PHOTO-STORAGE — stockage durable des photos de valises.
 *
 * PROBLÈME RÉSOLU : la photo uploadée pendant l'inscription était écrite
 * uniquement sur le système de fichiers du conteneur (uploads/baggage-photos/).
 * À chaque redéploiement Coolify le conteneur est recréé → fichiers supprimés,
 * mais `photoPath` reste en DB → `existsSync()` échoue → 404 → image cassée
 * sur la page trouveur (quelques temps après l'activation).
 *
 * SOLUTION : le contenu binaire de la photo est copié en base (BLOB SQLite)
 * au moment de l'activation. Le disque n'est plus qu'un cache de staging :
 *  - upload  → écrit sur disque (staging) + DB au bind (activate / checklist)
 *  - lecture → DB d'abord ; fallback disque + migration automatique vers la DB
 * Résultat : la photo survit aux redéploiements et aux purges de fichiers.
 */

export const PHOTO_MIME_BY_EXT: Record<string, string> = {
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  heic: 'image/heic', // photos iPhone (format natif caméra)
  heif: 'image/heif',
};

/** Taille max acceptée pour une photo (10 Mo, aligné sur les endpoints d'upload) */
export const PHOTO_MAX_BYTES = 10 * 1024 * 1024;

/** Résout un chemin relatif `uploads/...` depuis le cwd, en neutralisant la traversée. */
export function safePhotoAbsolutePath(photoPath: string): string {
  const safePath = photoPath.replace(/\.\./g, '').replace(/^\/+/, '');
  return join(process.cwd(), safePath);
}

/** Déduit le MIME type depuis l'extension d'un chemin de fichier. */
export function photoMimeFromPath(photoPath: string): string {
  const ext = photoPath.split('.').pop()?.toLowerCase() || 'jpg';
  return PHOTO_MIME_BY_EXT[ext] || 'image/jpeg';
}

export interface PhotoBlob {
  data: Buffer;
  mime: string;
  size: number;
}

/**
 * Lit une photo sur disque (chemin relatif `uploads/...`) et retourne son blob.
 * Retourne null si le fichier est absent, vide ou trop volumineux.
 */
export async function readPhotoFromDisk(photoPath: string): Promise<PhotoBlob | null> {
  if (!photoPath || photoPath.length > 500) return null;
  try {
    const absolutePath = safePhotoAbsolutePath(photoPath);
    if (!existsSync(absolutePath)) return null;
    const stat = await import('fs/promises').then((m) => m.stat(absolutePath));
    if (!stat.isFile() || stat.size === 0 || stat.size > PHOTO_MAX_BYTES) return null;
    const data = await readFile(absolutePath);
    return { data, mime: photoMimeFromPath(absolutePath), size: data.length };
  } catch {
    return null;
  }
}

/** Écrit une photo sur disque (staging) dans uploads/baggage-photos/ ou uploads/checklist-photos/. */
export async function writePhotoToDisk(
  folder: 'baggage-photos' | 'checklist-photos',
  filename: string,
  data: Buffer
): Promise<string> {
  const relativePath = `uploads/${folder}/${filename}`;
  const absolutePath = join(process.cwd(), relativePath);
  await mkdir(join(process.cwd(), 'uploads', folder), { recursive: true });
  await writeFile(absolutePath, data);
  return relativePath;
}
