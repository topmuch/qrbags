const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
async function main() {
  const updated = await db.baggage.updateMany({
    where: { setId: 'VOL-2026-FLUX' },
    data: { airlineName: 'Air Sénégal', flightNumber: 'SN209' },
  });
  console.log(`Mis à jour: ${updated.count} bagages du set VOL-2026-FLUX`);
  const bag = await db.baggage.findFirst({ where: { reference: 'VOL26-FLUX02' } });
  console.log(JSON.stringify({ ref: bag.reference, airline: bag.airlineName, flight: bag.flightNumber, status: bag.status }, null, 2));
}
main().catch(console.error).finally(() => db.$disconnect());
