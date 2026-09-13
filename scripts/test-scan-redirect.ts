/**
 * Test E2E : page /scan/[reference] pour un QR voyageur pending_activation
 * Vérifie que la page compile et que l'API renvoie pending_activation (flux sans sélecteur transport).
 */
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();
const BASE = 'http://localhost:3000';

async function main() {
  const suffix = Date.now().toString(36).toUpperCase().slice(-4);
  const reference = `VOL26-SCN${suffix}`;
  await db.baggage.create({
    data: {
      reference,
      type: 'voyageur',
      status: 'pending_activation',
    } as never,
  });
  console.log('Bagage test créé:', reference);

  // 1. API scan → status attendu
  const apiRes = await fetch(`${BASE}/api/scan/${reference}`);
  const apiData = await apiRes.json();
  console.log('API /api/scan:', apiRes.status, 'status =', apiData.status ?? apiData.baggage?.status);
  if (apiData.status !== 'pending_activation') {
    throw new Error(`statut inattendu: ${apiData.status}`);
  }

  // 2. Page /scan → 200 sans erreur de compilation
  const pageRes = await fetch(`${BASE}/scan/${reference}`);
  const html = await pageRes.text();
  console.log('Page /scan:', pageRes.status, `(${html.length} octets)`);
  if (pageRes.status !== 200) throw new Error(`page /scan status ${pageRes.status}`);
  for (const pat of ['Module not found', 'Build Error', 'Compilation Error']) {
    if (html.includes(pat)) throw new Error(`Erreur de compilation détectée: ${pat}`);
  }

  // 3. Le code source de la page ne référence plus le sélecteur
  const fs = await import('fs');
  const src = fs.readFileSync('src/app/scan/[reference]/page.tsx', 'utf-8');
  if (src.includes('TransportModeSelector')) throw new Error('TransportModeSelector encore référencé !');
  if (src.includes('selectedMode')) throw new Error('selectedMode encore référencé !');
  if (src.includes('&mode=')) throw new Error('paramètre &mode= encore présent !');
  console.log('✅ SUCCÈS : /scan sans sélecteur de transport, redirection directe /inscrire?qr=REF');

  // 4. Nettoyage
  await db.baggage.deleteMany({ where: { reference } });
  console.log('Nettoyage OK');
}

main()
  .catch((e) => { console.error('❌ ÉCHEC:', e.message); process.exitCode = 1; })
  .finally(() => db.$disconnect());
