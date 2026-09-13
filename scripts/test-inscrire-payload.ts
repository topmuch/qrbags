/**
 * Test E2E : payload minimal du nouveau formulaire /inscrire (sans champs transport)
 * Vérifie que l'activation groupée fonctionne toujours (2 QR du set activés).
 */
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();
const BASE = 'http://localhost:3000';

async function main() {
  const setId = `VOL-2026-TESTUI-${Date.now().toString(36).toUpperCase()}`;
  const refs = [`VOL26-TUI01${Date.now().toString(36).toUpperCase().slice(-3)}`, `VOL26-TUI02${Date.now().toString(36).toUpperCase().slice(-3)}`];

  // 1. Créer un set voyageur de 2 QR en pending_activation
  for (let i = 0; i < 2; i++) {
    await db.baggage.create({
      data: {
        reference: refs[i],
        type: 'voyageur',
        status: 'pending_activation',
        setId,
        baggageIndex: i + 1,
      } as never,
    });
  }
  console.log('Set créé:', setId, refs);

  // 2. POST /api/activate — EXACTEMENT le payload du nouveau formulaire /inscrire
  const payload = {
    reference: refs[0],
    travelerFirstName: 'Marie',
    travelerLastName: 'Dupont',
    whatsappOwner: '+221771234567',
    transportMode: 'flight',
    destination: 'Dakar',
    departureDate: '2026-08-15',
    departureTime: '14:30',
  };
  const res = await fetch(`${BASE}/api/activate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  console.log('Réponse API:', res.status, JSON.stringify(data));

  if (!res.ok || !data.success) throw new Error('Activation échouée');
  if (data.activatedCount !== 2) throw new Error(`activatedCount=${data.activatedCount}, attendu 2`);

  // 3. Vérifier en base
  const bags = await db.baggage.findMany({ where: { setId } });
  for (const b of bags) {
    if (b.status !== 'active') throw new Error(`${b.reference} pas active`);
    if (b.transportMode !== 'flight') throw new Error(`${b.reference} transportMode=${b.transportMode}`);
    if (b.travelerFirstName !== 'Marie') throw new Error(`${b.reference} prénom non copié`);
  }
  console.log('✅ SUCCÈS : 2 QR activés, transportMode=flight défaut, infos copiées');

  // 4. Nettoyage
  await db.baggage.deleteMany({ where: { setId } });
  console.log('Nettoyage OK');
}

main()
  .catch((e) => { console.error('❌ ÉCHEC:', e.message); process.exitCode = 1; })
  .finally(() => db.$disconnect());
