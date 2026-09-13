/**
 * Test de l'activation groupée des QR codes (QRBags)
 * Scénario :
 *   1. Crée un set VOYAGEUR de 2 QR en pending_activation (même setId)
 *   2. Crée un set HAJJ de 3 QR en pending_activation (même setId)
 *   3. Active le 1er QR de chaque set via POST /api/activate
 *   4. Vérifie que TOUS les QR de chaque set sont passés en "active"
 *   5. Nettoie les données de test
 */
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();
const BASE = 'http://localhost:3000';
const refs = { voyageur: [] as string[], hajj: [] as string[] };
const setIds = { voyageur: 'VOL-TEST-GRPV', hajj: 'HAJJ-TEST-GRPH' };

async function createTestSet(type: 'voyageur' | 'hajj', count: number, prefix: string) {
  const data = [];
  for (let i = 1; i <= count; i++) {
    data.push({
      reference: `${prefix}${Date.now().toString().slice(-6)}${i}-TEST${i}`,
      type,
      setId: setIds[type],
      agencyId: null,
      baggageIndex: i,
      baggageType: 'soute',
      status: 'pending_activation',
    });
  }
  await db.baggage.createMany({ data });
  return data.map((d) => d.reference);
}

async function activate(reference: string) {
  const res = await fetch(`${BASE}/api/activate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reference,
      travelerFirstName: 'Test',
      travelerLastName: 'GroupActivation',
      whatsappOwner: '+221770000000',
      transportMode: 'flight',
      airlineName: 'Air Test',
      flightNumber: 'AT-100',
      destination: 'Dakar',
    }),
  });
  return { status: res.status, body: await res.json() };
}

async function checkSet(type: 'voyageur' | 'hajj', expectedCount: number) {
  const rows = await db.baggage.findMany({ where: { setId: setIds[type] } });
  const allActive = rows.every((r) => r.status === 'active');
  const ownerInfoOk = rows.every(
    (r) => r.travelerFirstName === 'Test' && r.airlineName === 'Air Test' && r.transportMode === 'flight'
  );
  return { count: rows.length, allActive, ownerInfoOk, statuses: rows.map((r) => `${r.reference.slice(0, 14)}…:${r.status}`) };
}

async function main() {
  console.log('⏳ Attente du serveur sur', BASE);
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(BASE);
      if (r.ok) break;
    } catch { /* pas encore prêt */ }
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log('\n═══ 1. Création des sets de test ═══');
  refs.voyageur = await createTestSet('voyageur', 2, 'VOL26-T');
  refs.hajj = await createTestSet('hajj', 3, 'HAJJ26-T');
  console.log('VOYAGEUR (2 QR, même setId):', refs.voyageur);
  console.log('HAJJ (3 QR, même setId):', refs.hajj);

  console.log('\n═══ 2. Activation du 1er QR VOYAGEUR ═══');
  const r1 = await activate(refs.voyageur[0]);
  console.log('HTTP', r1.status, '| activatedCount:', r1.body.activatedCount, '| refs:', r1.body.activatedReferences);

  console.log('\n═══ 3. Activation du 1er QR HAJJ ═══');
  const r2 = await activate(refs.hajj[0]);
  console.log('HTTP', r2.status, '| activatedCount:', r2.body.activatedCount, '| refs:', r2.body.activatedReferences);

  console.log('\n═══ 4. Vérification en base ═══');
  const v = await checkSet('voyageur', 2);
  console.log('VOYAGEUR:', v.count, 'QR |', v.allActive ? '✅ tous actifs' : '❌ pas tous actifs', '|', v.ownerInfoOk ? '✅ infos copiées' : '❌ infos manquantes');
  console.log('  ', v.statuses.join(' | '));
  const h = await checkSet('hajj', 3);
  console.log('HAJJ:', h.count, 'QR |', h.allActive ? '✅ tous actifs' : '❌ pas tous actifs', '|', h.ownerInfoOk ? '✅ infos copiées' : '❌ infos manquantes');
  console.log('  ', h.statuses.join(' | '));

  const success = r1.body.activatedCount === 2 && r2.body.activatedCount === 3 && v.allActive && v.ownerInfoOk && h.allActive && h.ownerInfoOk;

  console.log('\n═══ 5. Nettoyage ═══');
  const del = await db.baggage.deleteMany({ where: { setId: { in: [setIds.voyageur, setIds.hajj] } } });
  console.log(`${del.count} QR de test supprimés`);

  await db.$disconnect();
  console.log(success ? '\n🎉 TEST GLOBAL : ✅ SUCCÈS' : '\n💥 TEST GLOBAL : ❌ ÉCHEC');
  process.exit(success ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
