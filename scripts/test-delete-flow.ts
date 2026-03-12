import { db } from '../src/lib/db'

async function main() {
  // Simulate the GET request - find a voyageur
  const baggages = await db.baggage.findMany({
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
  
  if (baggages.length === 0) {
    console.log('No voyageurs to test')
    return
  }
  
  // Take the first one
  const first = baggages[0]
  const keyData = {
    firstName: first.travelerFirstName || '',
    lastName: first.travelerLastName || '',
    whatsapp: first.whatsappOwner || '',
    agencyId: first.agencyId || ''
  }
  const key = JSON.stringify(keyData)
  
  console.log('Testing delete flow:')
  console.log('1. Voyageur:', first.reference)
  console.log('2. Key data:', keyData)
  console.log('3. JSON key:', key)
  console.log('4. Encoded for URL:', encodeURIComponent(key))
  
  // Simulate the DELETE request - find by key
  const decodedKey = JSON.parse(decodeURIComponent(encodeURIComponent(key)))
  console.log('5. Decoded key:', decodedKey)
  
  const whereClause = {
    type: 'voyageur' as const,
    travelerFirstName: decodedKey.firstName || null,
    travelerLastName: decodedKey.lastName || null,
    whatsappOwner: decodedKey.whatsapp || null,
    agencyId: decodedKey.agencyId || null
  }
  console.log('6. Where clause:', whereClause)
  
  const found = await db.baggage.findMany({
    where: whereClause,
    select: { reference: true }
  })
  console.log('7. Found baggages:', found.map(b => b.reference))
}

main().catch(console.error).finally(() => process.exit(0))
