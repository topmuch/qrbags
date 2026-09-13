/* Test E2E bugs utilisateur : export ZIP sets + dashboard agence */
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
const BASE = 'http://localhost:3000';
let results = [];
function ok(name, cond, detail) { results.push({ name, ok: !!cond, detail: detail || '' }); console.log(`${cond ? '✅' : '❌'} ${name}${detail ? ' — ' + detail : ''}`); }

async function main() {
  // ── SETUP: créer une agence de test
  const agency = await db.agency.create({ data: { slug: 'test-agence-export', name: 'Agence Test Export', email: 'test@agence.sn', phone: '+221770000009', active: true } });
  ok('Agence créée', agency.id, agency.name);

  // ── TEST 1: génération AGENCY (flux utilisateur bug 2)
  const r1 = await fetch(`${BASE}/api/admin/baggages/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ context: 'agency', type: 'voyageur', agencyId: agency.id, travelerCount: 3, count: 2 }) });
  const d1 = await r1.json();
  ok('POST generate agency → 200', r1.status === 200, `${d1.generated} QR générés`);
  ok('Réponse contient setIds (fix bug 1)', Array.isArray(d1.setIds) && d1.setIds.length === 3, `setIds: ${JSON.stringify(d1.setIds)}`);

  // ── TEST 2: dashboard agence retourne les QR (bug 2)
  const r2 = await fetch(`${BASE}/api/agency/baggages?agencyId=${agency.id}`);
  const d2 = await r2.json();
  ok('GET /api/agency/baggages → 200', r2.status === 200);
  ok('Dashboard voit les 6 QR', d2.baggages?.length === 6, `trouvés: ${d2.baggages?.length}`);
  ok('Stats correctes', d2.stats?.total === 6 && d2.stats?.pending === 6, JSON.stringify(d2.stats));
  ok('agencyId bien associé', d2.baggages?.every(b => b.agencyId === agency.id), '');

  // ── TEST 3: export ZIP avec setIds directs (nouveau chemin fix bug 1)
  const r3 = await fetch(`${BASE}/api/admin/baggages/export-zip`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ setIds: d1.setIds }) });
  ok('POST export-zip (setIds directs) → 200', r3.status === 200, `content-type: ${r3.headers.get('content-type')}`);
  const buf3 = Buffer.from(await r3.arrayBuffer());
  ok('ZIP non vide (signature PK)', buf3.length > 1000 && buf3[0] === 0x50 && buf3[1] === 0x4b, `${buf3.length} octets`);

  // ── TEST 4: fallback re-scan par références (ancien chemin conservé)
  const r4 = await fetch(`${BASE}/api/admin/baggages/generate?limit=2000`);
  const d4 = await r4.json();
  const refSet = new Set(d1.references);
  const found = new Set(d4.baggages.filter(b => refSet.has(b.reference) && b.setId).map(b => b.setId));
  ok('Fallback re-scan trouve les 3 sets', found.size === 3, `${found.size} sets`);

  // ── TEST 5: génération INDIVIDUAL retourne aussi setIds
  const r5 = await fetch(`${BASE}/api/admin/baggages/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ context: 'individual', type: 'voyageur', firstName: 'Awa', lastName: 'Test', whatsapp: '+221770000002', duration: '7d', baggageCount: 2 }) });
  const d5 = await r5.json();
  ok('POST generate individual → setIds présent', Array.isArray(d5.setIds) && d5.setIds.length === 1, `setIds: ${JSON.stringify(d5.setIds)}`);

  // ── CLEANUP
  const ids = await db.baggage.findMany({ where: { OR: [{ agencyId: agency.id }, { reference: { in: d5.references } }] }, select: { id: true } });
  await db.scanLog.deleteMany({ where: { baggageId: { in: ids.map(b => b.id) } } });
  const del = await db.baggage.deleteMany({ where: { OR: [{ agencyId: agency.id }, { reference: { in: d5.references } }] } });
  await db.agency.delete({ where: { id: agency.id } });
  ok('Cleanup', del.count === 8, `${del.count} baggages + agence supprimés`);

  const passed = results.filter(r => r.ok).length;
  console.log(`\n═══ RÉSULTAT: ${passed}/${results.length} tests OK ═══`);
  if (passed !== results.length) process.exit(1);
}
main().catch(e => { console.error('ERREUR:', e.message); process.exit(1); }).finally(() => db.$disconnect());
