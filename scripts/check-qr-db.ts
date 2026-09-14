import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  console.log('DATABASE_URL:', process.env.DATABASE_URL)

  const total = await db.baggage.count()
  console.log('Total Baggage (QR codes):', total)

  const byStatus = await db.baggage.groupBy({
    by: ['status'],
    _count: { _all: true },
  })
  console.log('By status:', JSON.stringify(byStatus, null, 2))

  const withAgency = await db.baggage.count({
    where: { agencyId: { not: null } },
  })
  console.log('Baggage with agencyId:', withAgency)

  const agencies = await db.agency.count()
  console.log('Total agencies:', agencies)

  const users = await db.user.count()
  console.log('Total users:', users)

  // Sample of latest 5
  const latest = await db.baggage.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { id: true, reference: true, status: true, agencyId: true, createdAt: true },
  })
  console.log('Latest 5:', JSON.stringify(latest, null, 2))
}

main()
  .catch((e) => {
    console.error('ERROR:', e.message)
    if (String(e.message).includes('P2022') || String(e.message).includes('Unknown column')) {
      console.error('>>> SCHEMA MISMATCH DETECTED (P2022)')
    }
  })
  .finally(() => db.$disconnect())
