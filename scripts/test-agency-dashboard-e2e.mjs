/* ═══════════════════════════════════════════════════════════════════
 * Test E2E — bugs utilisateur : export ZIP + dashboard agence vide
 * 1. Génère 6 QR (3 voyageurs × 2 bagages) pour l'agence démo
 * 2. Vérifie /api/agency/baggages (dashboard) les voit + stats
 * 3. Export ZIP par agencyId → 200 + signature PK
 * 4. Export ZIP par setIds (flux post-génération) → 200 + signature PK
 * 5. GARDE les données (l'utilisateur doit voir un dashboard peuplé)
 * ═══════════════════════════════════════════════════════════════════ */
const BASE = 'http://localhost:3000';
const AGENCY_ID = 'cmu08ds8c000irhonezniq98l'; // FRANCINE MAKELA

let pass = 0, fail = 0;
const ok = (cond, label, extra = '') => {
  if (cond) { pass++; console.log(`  ✅ ${label}${extra ? ' — ' + extra : ''}`); }
  else { fail++; console.log(`  ❌ ${label}${extra ? ' — ' + extra : ''}`); }
};

const jsonBody = async (r) => { try { return await r.json(); } catch { return {}; } };

(async () => {
  console.log('\n── TEST 1 : génération agence (3 voyageurs × 2 bagages) ──');
  const genRes = await fetch(`${BASE}/api/admin/baggages/generate`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ context: 'agency', type: 'voyageur', agencyId: AGENCY_ID, travelerCount: 3, count: 2 }),
  });
  const gen = await jsonBody(genRes);
  ok(genRes.ok, 'POST generate 200', `status=${genRes.status}`);
  ok(gen.generated === 6, '6 QR générés', `generated=${gen.generated}`);
  ok(Array.isArray(gen.setIds) && gen.setIds.length === 3, 'API retourne 3 setIds', JSON.stringify(gen.setIds));
  const setIds = gen.setIds || [];

  console.log('\n── TEST 2 : dashboard agence voit les bagages ──');
  const dashRes = await fetch(`${BASE}/api/agency/baggages?agencyId=${AGENCY_ID}`);
  const dash = await jsonBody(dashRes);
  ok(dashRes.ok, 'GET /api/agency/baggages 200');
  ok((dash.baggages || []).length >= 6, 'dashboard liste ≥ 6 bagages', `total=${dash.baggages?.length}`);
  ok(dash.stats?.total >= 6, 'stats.total ≥ 6', JSON.stringify(dash.stats));
  const agencyOk = (dash.baggages || []).every(b => b.agencyId === AGENCY_ID);
  ok(agencyOk, 'tous liés à la bonne agence');

  console.log('\n── TEST 3 : export ZIP par agencyId ──');
  const expA = await fetch(`${BASE}/api/admin/baggages/export-zip`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agencyId: AGENCY_ID }),
  });
  const bufA = Buffer.from(await expA.arrayBuffer());
  ok(expA.ok, 'POST export-zip (agencyId) 200', `status=${expA.status}`);
  ok(expA.headers.get('content-type')?.includes('zip'), 'Content-Type zip');
  ok(bufA.length > 1000 && bufA[0] === 0x50 && bufA[1] === 0x4b, 'ZIP valide (signature PK)', `${bufA.length} octets`);

  console.log('\n── TEST 4 : export ZIP par setIds (flux post-génération) ──');
  const expS = await fetch(`${BASE}/api/admin/baggages/export-zip`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ setIds }),
  });
  const bufS = Buffer.from(await expS.arrayBuffer());
  ok(expS.ok, 'POST export-zip (setIds) 200', `status=${expS.status}`);
  ok(bufS.length > 1000 && bufS[0] === 0x50 && bufS[1] === 0x4b, 'ZIP valide (signature PK)', `${bufS.length} octets`);

  console.log('\n── TEST 5 : erreurs propres (pas de 500) ──');
  const expE = await fetch(`${BASE}/api/admin/baggages/export-zip`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ setIds: ['SET-INEXISTANT-123'] }),
  });
  const errE = await jsonBody(expE);
  ok(expE.status === 404, 'setIds inexistants → 404 (pas 500)', `status=${expE.status}, error=${errE.error}`);

  console.log(`\n══ RÉSULTAT : ${pass} OK / ${fail} ÉCHEC(S) ══`);
  process.exit(fail > 0 ? 1 : 0);
})().catch(e => { console.error('ERREUR FATALE:', e); process.exit(2); });
