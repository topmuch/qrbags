const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
async function main() {
  const total = await db.baggage.count();
  const byStatus = await db.baggage.groupBy({ by: ['status'], _count: true });
  const byAgency = await db.baggage.groupBy({ by: ['agencyId'], _count: true, where: { agencyId: { not: null } } });
  const agencies = await db.agency.findMany({ select: { id: true, slug: true, email: true, active: true }, take: 10 });
  const recent = await db.baggage.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { reference: true, setId: true, agencyId: true, status: true, createdAt: true } });
  console.log('TOTAL baggages:', total);
  console.log('Par statut:', JSON.stringify(byStatus));
  console.log('Par agence:', JSON.stringify(byAgency));
  console.log('Agences:', JSON.stringify(agencies));
  console.log('5 plus récents:', JSON.stringify(recent, null, 1));
}
main().catch(console.error).finally(() => db.$disconnect());
