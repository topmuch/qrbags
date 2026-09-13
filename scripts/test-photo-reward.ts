/**
 * Test E2E — PHOTO valise + RÉCOMPENSE :
 * 1. Upload photo (multipart) → /api/baggage-photo/upload
 * 2. Activation avec payload exact de /inscrire (photoPath + reward) → activation groupée set de 2
 * 3. GET /api/scan/[reference] → photoUrl + reward exposés
 * 4. GET photoUrl → 200 image/*
 * 5. Nettoyage (baggages + fichier uploadé)
 */
import { PrismaClient } from '@prisma/client';
import { unlink } from 'fs/promises';
import { join } from 'path';

const db = new PrismaClient();
const BASE = 'http://localhost:3000';

// PNG 1x1 rouge (bytes valides)
const PNG_BYTES = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
  0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
  0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xdd, 0x8d, 0xb0, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e,
  0x44, 0xae, 0x42, 0x60, 0x82,
]);

async function main() {
  const suffix = Date.now().toString(36).toUpperCase().slice(-4);
  const setId = `VOL-2026-TESTPH-${suffix}`;
  const refs = [`VOL26-PH01${suffix}`, `VOL26-PH02${suffix}`];

  // 1. Set voyageur de 2 QR en attente
  for (let i = 0; i < 2; i++) {
    await db.baggage.create({
      data: { reference: refs[i], type: 'voyageur', status: 'pending_activation', setId, baggageIndex: i + 1 } as never,
    });
  }
  console.log('Set créé:', setId);

  // 2. Upload photo
  const fd = new FormData();
  fd.append('file', new Blob([PNG_BYTES], { type: 'image/png' }), 'photo-valise.png');
  const upRes = await fetch(`${BASE}/api/baggage-photo/upload`, { method: 'POST', body: fd });
  const upData = await upRes.json();
  console.log('Upload photo:', upRes.status, JSON.stringify(upData));
  if (!upRes.ok || !upData.photoPath) throw new Error('upload photo échoué');

  // 3. Activation — payload EXACT du nouveau formulaire /inscrire
  const payload = {
    reference: refs[0],
    travelerFirstName: 'Awa',
    travelerLastName: 'Ndiaye',
    whatsappOwner: '+221770000000',
    transportMode: 'flight',
    destination: 'Dakar',
    reward: '50 000 FCFA',
    photoPath: upData.photoPath,
  };
  const actRes = await fetch(`${BASE}/api/activate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const actData = await actRes.json();
  console.log('Activation:', actRes.status, 'activatedCount =', actData.activatedCount);
  if (!actRes.ok || actData.activatedCount !== 2) {
    console.error('Détail réponse:', JSON.stringify(actData).slice(0, 500));
    throw new Error('activation groupée échouée');
  }

  // 4. Vérif base : photoPath + reward copiés sur TOUT le set
  const bags = await db.baggage.findMany({ where: { setId } });
  for (const b of bags) {
    if (b.photoPath !== upData.photoPath) throw new Error(`${b.reference}: photoPath incorrect`);
    if (b.reward !== '50 000 FCFA') throw new Error(`${b.reference}: reward incorrect`);
  }
  console.log('✅ Base : photoPath + reward sur les 2 QR du set');

  // 5. API scan → photoUrl + reward
  const scanRes = await fetch(`${BASE}/api/scan/${refs[0]}`);
  const scanData = await scanRes.json();
  console.log('Scan:', scanRes.status, 'photoUrl =', scanData.baggage?.photoUrl, '| reward =', scanData.baggage?.reward);
  if (scanData.baggage?.photoUrl !== `/api/baggage-photo/${refs[0]}`) throw new Error('photoUrl absent du scan');
  if (scanData.baggage?.reward !== '50 000 FCFA') throw new Error('reward absent du scan');

  // 6. Service de l'image
  const imgRes = await fetch(`${BASE}${scanData.baggage.photoUrl}`);
  const contentType = imgRes.headers.get('content-type');
  console.log('Image:', imgRes.status, contentType, `(${(await imgRes.arrayBuffer()).byteLength} octets)`);
  if (imgRes.status !== 200 || !contentType?.startsWith('image/')) throw new Error('image non servie');

  // 7. 404 pour une référence sans photo
  const nfRes = await fetch(`${BASE}/api/baggage-photo/VOL26-INEXISTANT`);
  console.log('404 sans photo:', nfRes.status);
  if (nfRes.status !== 404) throw new Error('404 attendu');

  // 8. Nettoyage
  await db.baggage.deleteMany({ where: { setId } });
  await unlink(join(process.cwd(), upData.photoPath));
  console.log('✅ SUCCÈS TOTAL — nettoyage effectué');
}

main()
  .catch((e) => { console.error('❌ ÉCHEC:', e.message); process.exitCode = 1; })
  .finally(() => db.$disconnect());
