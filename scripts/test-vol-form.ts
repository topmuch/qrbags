/**
 * TEST-VOL-FORM : setup + vérification E2E des champs compagnie aérienne / numéro de vol
 * Usage :
 *   npx tsx scripts/test-vol-form.ts setup    → crée un set de 2 QR voyageur en attente
 *   npx tsx scripts/test-vol-form.ts check    → vérifie que airlineName/flightNumber sont en base
 *   npx tsx scripts/test-vol-form.ts cleanup  → supprime le set de test + logs associés
 */
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();
const SET_ID = 'SET-TEST-VOL';
const PREFIX = 'VOL26-TESTVOL';

async function setup() {
  // Nettoyage préalable au cas où
  await cleanup();
  const data = [1, 2].map((i) => ({
    reference: `${PREFIX}${i}`,
    type: 'voyageur',
    setId: SET_ID,
    agencyId: null,
    baggageIndex: i,
    baggageType: 'soute',
    status: 'pending_activation',
  }));
  await db.baggage.createMany({ data });
  console.log(`✅ Setup : ${data.length} QR créés (${PREFIX}1, ${PREFIX}2), setId=${SET_ID}`);
}

async function check() {
  const bags = await db.baggage.findMany({
    where: { setId: SET_ID },
    select: {
      reference: true,
      status: true,
      travelerFirstName: true,
      travelerLastName: true,
      airlineName: true,
      flightNumber: true,
      destination: true,
    },
  });
  console.log('📋 État en base :');
  console.log(JSON.stringify(bags, null, 2));

  const activated = bags.filter((b) => b.status === 'active');
  const withVol = bags.filter((b) => b.airlineName && b.flightNumber);
  console.log(`\nActivées : ${activated.length}/${bags.length}`);
  console.log(`Avec compagnie+vol renseignés : ${withVol.length}/${bags.length}`);
  if (activated.length > 0 && withVol.length === activated.length) {
    console.log('✅ CHECK OK : activation set + vol enregistré');
  } else {
    console.log('❌ CHECK KO');
    process.exit(1);
  }
}

async function cleanup() {
  const refs = await db.baggage.findMany({ where: { setId: SET_ID }, select: { reference: true } });
  if (refs.length === 0) {
    console.log('Rien à nettoyer');
    return;
  }
  // Supprime d'abord les enregistrements liés (scan logs, etc.) puis les bagages
  const ids = await db.baggage.findMany({ where: { setId: SET_ID }, select: { id: true } });
  await db.scanLog.deleteMany({ where: { baggageId: { in: ids.map((b) => b.id) } } });
  await db.baggage.deleteMany({ where: { setId: SET_ID } });
  console.log(`🧹 Cleanup : ${refs.length} bagages de test supprimés`);
}

async function main() {
  const cmd = process.argv[2] || 'setup';
  if (cmd === 'setup') await setup();
  else if (cmd === 'check') await check();
  else if (cmd === 'cleanup') await cleanup();
  else console.log('Usage: setup | check | cleanup');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
