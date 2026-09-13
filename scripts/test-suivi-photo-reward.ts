/**
 * Test E2E Task 7 — Photo + récompense sur /suivi et dans les messages WhatsApp
 *
 * Vérifie :
 *   1. GET /api/suivi/{ref}       → photoUrl + reward exposés
 *   2. GET /api/baggage-photo/REF → 200 image/png (fichier servi)
 *   3. POST /api/scan/notify      → messageContent contient le lien 📸 photo (alerte propriétaire)
 *   4. generatePreFilledMessage   → ligne 🎁 Récompense présente (message propriétaire→trouveur),
 *                                    absente sans reward, troncature ≤ 400 chars OK
 *   5. Page /suivi/{ref}          → 200 sans erreur de compilation
 */
import { PrismaClient } from '@prisma/client';
import { mkdirSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { generatePreFilledMessage } from '../src/lib/whatsapp-message';

const db = new PrismaClient();
const BASE = 'http://localhost:3000';

const REF = 'VOL26-T7PHOTO';
const PHOTO_REL = 'uploads/baggage-photos/test-photo-task7.png';

// Petit PNG valide 2x2 rouge
const PNG_BYTES = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAEklEQVR4nGP8z8Dwn4GBgQEACyoCAqLvVMkAAAAASUVORK5CYII=',
  'base64'
);

let failures = 0;
function check(name: string, cond: boolean, detail = '') {
  if (cond) {
    console.log(`  ✅ ${name}`);
  } else {
    failures++;
    console.error(`  ❌ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

async function main() {
  // ─── Setup : fichier photo + bagage actif avec photoPath + reward ───
  mkdirSync(join(process.cwd(), 'uploads/baggage-photos'), { recursive: true });
  writeFileSync(join(process.cwd(), PHOTO_REL), PNG_BYTES);

  await db.baggage.deleteMany({ where: { reference: REF } });
  await db.baggage.create({
    data: {
      reference: REF,
      type: 'voyageur',
      status: 'active',
      transportMode: 'flight',
      travelerFirstName: 'Test',
      travelerLastName: 'Owner',
      destination: 'Dakar',
      whatsappOwner: '+221770000000',
      photoPath: PHOTO_REL,
      reward: '50 000 FCFA',
      airlineName: 'Air Sénégal',
      flightNumber: 'SN205',
    } as never,
  });
  console.log('Bagage test créé:', REF, '— photoPath + reward="50 000 FCFA"');

  // ─── 1. API /api/suivi expose photoUrl + reward ───
  console.log('\n[1] GET /api/suivi/' + REF);
  const suiviRes = await fetch(`${BASE}/api/suivi/${REF}`);
  const suivi = await suiviRes.json();
  check('status HTTP 200', suiviRes.status === 200);
  check('photoUrl exposé', suivi.baggage?.photoUrl === `/api/baggage-photo/${REF}`, JSON.stringify(suivi.baggage?.photoUrl));
  check('reward exposé', suivi.baggage?.reward === '50 000 FCFA', JSON.stringify(suivi.baggage?.reward));

  // ─── 2. API /api/baggage-photo sert le fichier ───
  console.log('\n[2] GET /api/baggage-photo/' + REF);
  const photoRes = await fetch(`${BASE}/api/baggage-photo/${REF}`);
  check('status HTTP 200', photoRes.status === 200, String(photoRes.status));
  check('Content-Type image/png', (photoRes.headers.get('content-type') || '').includes('image/png'));

  // ─── 3. Alerte WhatsApp propriétaire contient le lien photo ───
  console.log('\n[3] POST /api/scan/notify');
  const notifyRes = await fetch(`${BASE}/api/scan/notify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reference: REF,
      location: { city: 'Dakar', country: 'SN' },
      finderName: 'Finder T7',
      finderPhone: '+221771111111',
      message: 'Bagage retrouvé à la sortie',
    }),
  });
  const notify = await notifyRes.json();
  check('status HTTP 200', notifyRes.status === 200, JSON.stringify(notify));
  const msg: string = notify.messageContent || '';
  check('messageContent présent', msg.length > 0);
  check('📸 lien photo dans le message', msg.includes('📸 Photo du bagage :') && msg.includes(`/api/baggage-photo/${REF}`), msg.slice(-200));
  check('infos trouveur présentes', msg.includes('Finder T7'));

  // ─── 4. Message pré-rempli propriétaire→trouveur avec récompense ───
  console.log('\n[4] generatePreFilledMessage (récompense)');
  const baseParams = {
    baggage: {
      reference: 'VOL26-VABJZS',
      bagType: 'soute',
      transportMode: 'flight' as const,
      airlineName: 'Air France',
      flightNumber: 'AF1234',
      destination: 'Paris',
    },
    scanData: { city: 'Dakar', address: '', context: 'static_location' },
    finder: { name: 'Ouslane Diop', whatsapp: '+221784858226' },
    locale: 'fr' as const,
  };

  const withReward = generatePreFilledMessage({
    ...baseParams,
    baggage: { ...baseParams.baggage, reward: '50 000 FCFA' },
  });
  check('ligne 🎁 Récompense présente', withReward.includes('🎁 Récompense promise : 50 000 FCFA'), withReward);
  check('longueur ≤ 400', withReward.length <= 400, String(withReward.length));

  const withoutReward = generatePreFilledMessage(baseParams);
  check('pas de 🎁 sans reward', !withoutReward.includes('🎁'));

  const truncated = generatePreFilledMessage({
    ...baseParams,
    baggage: {
      ...baseParams.baggage,
      reward: '50 000 FCFA',
      airlineName: 'A'.repeat(80),
      destination: 'D'.repeat(80),
    },
    finder: { name: 'N'.repeat(60), whatsapp: '+221784858226' },
  });
  check('troncature ≤ 400 chars', truncated.length <= 400, String(truncated.length));

  // ─── 5. Page /suivi compile et répond ───
  console.log('\n[5] GET /suivi/' + REF);
  const pageRes = await fetch(`${BASE}/suivi/${REF}`);
  const pageHtml = await pageRes.text();
  check('status HTTP 200', pageRes.status === 200);
  check('pas d\u2019erreur de compilation', !pageHtml.includes('__next_error__') && !/Internal Server Error/i.test(pageHtml));

  // ─── Nettoyage ───
  const testBag = await db.baggage.findUnique({ where: { reference: REF } });
  if (testBag) {
    await db.scanLog.deleteMany({ where: { baggageId: testBag.id } });
    await db.baggage.delete({ where: { id: testBag.id } });
  }
  try { unlinkSync(join(process.cwd(), PHOTO_REL)); } catch { /* déjà absent */ }
  console.log('\nNettoyage OK (baggage + scanLogs test + fichier photo)');

  if (failures > 0) {
    console.error(`\n❌ ÉCHEC : ${failures} vérification(s) en erreur`);
    process.exitCode = 1;
  } else {
    console.log('\n✅ SUCCÈS : photo/reward sur /suivi + WhatsApp propriétaire (photo) + WhatsApp trouveur (récompense)');
  }
}

main()
  .catch((e) => { console.error('❌ ÉCHEC:', e.message); process.exitCode = 1; })
  .finally(() => db.$disconnect());
