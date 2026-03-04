import { db } from '../src/lib/db'

async function main() {
  // Check baggages
  const baggages = await db.baggage.findMany({
    select: {
      id: true,
      reference: true,
      setId: true,
      type: true,
      travelerFirstName: true,
      travelerLastName: true,
      whatsappOwner: true,
      agencyId: true,
    },
    take: 10
  })
  
  console.log('=== BAGGAGES ===')
  console.log(JSON.stringify(baggages, null, 2))
  console.log('Total baggages:', await db.baggage.count())
  
  // Check voyageurs
  const voyageurs = await db.baggage.findMany({
    where: { type: 'voyageur' },
    select: {
      id: true,
      reference: true,
      travelerFirstName: true,
      travelerLastName: true,
      whatsappOwner: true,
      agencyId: true,
    }
  })
  
  console.log('\n=== VOYAGEURS ===')
  console.log(JSON.stringify(voyageurs, null, 2))
  console.log('Total voyageurs:', voyageurs.length)
}

main().catch(console.error).finally(() => process.exit(0))
