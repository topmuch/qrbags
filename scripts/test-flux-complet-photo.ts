/**
 * Test E2E Task 8 — FLUX COMPLET avec une VRAIE photo de valise
 *
 * Simule exactement le parcours utilisateur :
 *   1. Génération d'un set voyageur de 2 QR (pending_activation)
 *   2. Upload de la photo (multipart /api/baggage-photo/upload — comme /inscrire)
 *   3. Activation groupée /api/activate (photoPath + reward, comme le payload /inscrire)
 *   4. Scan trouveur GET /api/scan/{ref} → photoUrl + reward exposés
 *   5. Notification propriétaire POST /api/scan/notify → messageContent avec 📸 lien photo
 *   6. Suivi propriétaire GET /api/suivi/{ref} → photoUrl + reward + trouveur
 *   7. Étiquette 7×10 cm GET /api/labels/{ref} → PNG sauvegardé dans download/
 *
 * NOTE : le bagage de démo VOL26-FLUX01/02 est CONSERVÉ en base (pas de nettoyage)
 * pour permettre les captures d'écran mobiles et le test manuel de l'utilisateur.
 */
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();
const BASE = 'http://localhost:3000';

const SET_ID = 'VOL-2026-FLUX';
const REFS = ['VOL26-FLUX01', 'VOL26-FLUX02'];
const PHOTO_FILE = 'scripts/tmp-valise-1200.jpg';
const LABEL_OUT = 'download/etiquette-voyageur-VOL26-FLUX01.png';

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
  // ─── 1. Reset + création du set voyageur (2 QR) ───
  for (const ref of REFS) {
    const old = await db.baggage.findUnique({ where: { reference: ref } });
    if (old) {
      await db.scanLog.deleteMany({ where: { baggageId: old.id } });
      await db.baggage.delete({ where: { id: old.id } });
    }
  }
  for (let i = 0; i < 2; i++) {
    await db.baggage.create({
      data: {
        reference: REFS[i],
        type: 'voyageur',
        status: 'pending_activation',
        setId: SET_ID,
        baggageIndex: i + 1,
      } as never,
    });
  }
  console.log('Set créé:', SET_ID, REFS.join(' + '));

  // ─── 2. Upload de la VRAIE photo (multipart, identique à /inscrire) ───
  console.log('\n[1] POST /api/baggage-photo/upload (vraie photo JPEG)');
  const photoBuf = await Bun.file(PHOTO_FILE).arrayBuffer();
  const fd = new FormData();
  fd.append('file', new File([photoBuf], 'photo-valise.jpg', { type: 'image/jpeg' }));
  const upRes = await fetch(`${BASE}/api/baggage-photo/upload`, { method: 'POST', body: fd });
  const upData = await upRes.json();
  check('upload HTTP 200', upRes.status === 200, JSON.stringify(upData));
  const photoPath: string = upData.photoPath || '';
  check('photoPath retourné', photoPath.startsWith('uploads/baggage-photos/'), photoPath);

  // ─── 3. Activation groupée (payload EXACT de /inscrire) ───
  console.log('\n[2] POST /api/activate (payload /inscrire + photo + récompense)');
  const payload = {
    reference: REFS[0],
    travelerFirstName: 'Fatou',
    travelerLastName: 'Ndiaye',
    whatsappOwner: '+221771234567',
    transportMode: 'flight',
    destination: 'Dakar',
    departureDate: '2026-12-15',
    departureTime: '14:30',
    photoPath,
    reward: '50 000 FCFA',
  };
  const actRes = await fetch(`${BASE}/api/activate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const actData = await actRes.json();
  check('activation HTTP 200', actRes.ok && actData.success, JSON.stringify(actData).slice(0, 200));
  check('activatedCount = 2', actData.activatedCount === 2, String(actData.activatedCount));

  const bags = await db.baggage.findMany({ where: { setId: SET_ID } });
  check('2 bagages actifs', bags.length === 2 && bags.every((b) => b.status === 'active'));
  check('photoPath copié sur tout le set', bags.every((b) => b.photoPath === photoPath));
  check('reward copié sur tout le set', bags.every((b) => b.reward === '50 000 FCFA'));

  // ─── 4. Page trouveur : API scan expose photo + récompense ───
  console.log('\n[3] GET /api/scan/' + REFS[0]);
  const scanRes = await fetch(`${BASE}/api/scan/${REFS[0]}`);
  const scanData = await scanRes.json();
  check('scan HTTP 200', scanRes.status === 200);
  check('photoUrl exposée au trouveur', scanData.baggage?.photoUrl === `/api/baggage-photo/${REFS[0]}`, JSON.stringify(scanData.baggage?.photoUrl));
  check('reward exposé au trouveur', scanData.baggage?.reward === '50 000 FCFA');

  // ─── 5. Le trouveur soumet le formulaire /scan (VRAI flux UI) → alerte WhatsApp propriétaire ───
  console.log('\n[4] POST /api/scan/' + REFS[0] + ' (formulaire trouveur → WhatsApp « Bonne nouvelle »)');
  const scanPostRes = await fetch(`${BASE}/api/scan/${REFS[0]}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location: 'Terminal 1 Aéroport LSS',
      finderName: 'Moussa Fall',
      finderPhone: '+221770112233',
      message: '',
      latitude: 14.6708,
      longitude: -17.0733,
      country: 'SN',
      city: 'Dakar',
    }),
  });
  const scanPostData = await scanPostRes.json();
  check('POST scan HTTP 200', scanPostRes.status === 200 && scanPostData.success, JSON.stringify(scanPostData).slice(0, 200));
  const waUrl: string = scanPostData.whatsappUrl || '';
  const waText = decodeURIComponent((waUrl.split('?text=')[1] || '').replace(/\+/g, ' '));
  check('whatsappUrl wa.me générée', waUrl.startsWith('https://wa.me/221771234567'), waUrl.slice(0, 60));
  check('message « Bonne nouvelle » au propriétaire', waText.includes('Bonne nouvelle Fatou'));
  check('📸 lien photo dans WhatsApp propriétaire', waText.includes('📸 Photo du bagage :') && waText.includes(`/api/baggage-photo/${REFS[0]}`), waText.slice(-200));

  // ─── 6. Suivi propriétaire : photo + récompense + trouveur ───
  console.log('\n[5] GET /api/suivi/' + REFS[0]);
  const suiviRes = await fetch(`${BASE}/api/suivi/${REFS[0]}`);
  const suiviData = await suiviRes.json();
  check('suivi HTTP 200', suiviRes.status === 200);
  check('photoUrl exposée au propriétaire', suiviData.baggage?.photoUrl === `/api/baggage-photo/${REFS[0]}`);
  check('reward exposé au propriétaire', suiviData.baggage?.reward === '50 000 FCFA');
  check('trouveur visible (nom + téléphone)', suiviData.lastFinder?.name === 'Moussa Fall' && !!suiviData.lastFinder?.phone);

  // ─── 7. Étiquette 7×10 cm générée pour le QR principal ───
  console.log('\n[6] GET /api/labels/' + REFS[0] + ' (étiquette 7×10 cm)');
  const labelRes = await fetch(`${BASE}/api/labels/${REFS[0]}`);
  check('label HTTP 200', labelRes.status === 200, String(labelRes.status));
  check('Content-Type image/png', (labelRes.headers.get('content-type') || '').includes('image/png'));
  const labelBuf = await labelRes.arrayBuffer();
  check('label non vide (> 100 Ko)', labelBuf.byteLength > 100_000, `${labelBuf.byteLength} octets`);
  await Bun.write(LABEL_OUT, labelBuf);
  console.log(`  💾 étiquette sauvegardée: ${LABEL_OUT} (${(labelBuf.byteLength / 1024).toFixed(0)} Ko)`);

  // ─── 8. Page publique du bagage scanné ───
  console.log('\n[7] Pages publiques');
  for (const path of [`/scan/${REFS[0]}`, `/suivi/${REFS[0]}`, `/inscrire?qr=${REFS[1]}`]) {
    const res = await fetch(`${BASE}${path}`);
    const html = await res.text();
    check(`GET ${path} → 200 sans erreur`, res.status === 200 && !html.includes('__next_error__'));
  }

  console.log('\n════════════════════════════════════════');
  console.log(`DEMO CONSERVÉE : ${REFS[0]} + ${REFS[1]} (set ${SET_ID}) — photo + récompense « 50 000 FCFA »`);
  if (failures > 0) {
    console.error(`❌ ÉCHEC : ${failures} vérification(s) en erreur`);
    process.exitCode = 1;
  } else {
    console.log('✅ FLUX COMPLET VALIDÉ avec vraie photo : upload → activation groupée → trouveur → WhatsApp propriétaire → suivi → étiquette 7×10 cm');
  }
}

main()
  .catch((e) => { console.error('❌ ÉCHEC:', e.message); process.exitCode = 1; })
  .finally(() => db.$disconnect());
