const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
async function main() {
  const bags = await db.baggage.findMany({
    where: { status: 'active' },
    select: { reference: true, setId: true, travelerFirstName: true, travelerLastName: true, destination: true, airlineName: true, flightNumber: true, reward: true, photoPath: true, status: true, departureDate: true, expiresAt: true },
    take: 10,
    orderBy: { createdAt: 'desc' },
  });
  console.log(JSON.stringify(bags, null, 2));
}
main().catch(console.error).finally(() => db.$disconnect());
