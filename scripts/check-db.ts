import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const agencies = await prisma.agency.findMany();
  console.log('Agencies:', JSON.stringify(agencies, null, 2));
  
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, agencyId: true }
  });
  console.log('Users:', JSON.stringify(users, null, 2));
  
  const baggages = await prisma.baggage.findMany({
    select: { id: true, reference: true, type: true, agencyId: true },
    take: 10
  });
  console.log('Baggages:', JSON.stringify(baggages, null, 2));
}

main().finally(() => prisma.$disconnect());
