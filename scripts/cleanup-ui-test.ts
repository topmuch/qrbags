const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
async function main() {
  // nettoie les QR de test UI (Moussa Diallo, Aminata Sow, Test Download, VOL26-3MLZP2)
  const del = await db.baggage.deleteMany({ where: { OR: [
    { travelerFirstName: { in: ['Moussa', 'Aminata', 'Test'] } },
  ] } });
  console.log(`Nettoyés: ${del.count} baggages de test UI`);
  const agencies = await db.agency.findMany({ select: { name: true, slug: true } });
  console.log('Agences restantes:', JSON.stringify(agencies));
  const total = await db.baggage.count();
  console.log('Total baggages restants:', total);
}
main().catch(console.error).finally(() => db.$disconnect());
