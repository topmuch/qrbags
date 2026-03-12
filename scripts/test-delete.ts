import { db } from '../src/lib/db'

async function main() {
  // Test finding voyageurs
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
  
  console.log('=== VOYAGEURS ===')
  for (const v of voyageurs) {
    const keyData = {
      firstName: v.travelerFirstName || '',
      lastName: v.travelerLastName || '',
      whatsapp: v.whatsappOwner || '',
      agencyId: v.agencyId || ''
    }
    const key = JSON.stringify(keyData)
    console.log({
      reference: v.reference,
      name: `${v.travelerFirstName} ${v.travelerLastName}`,
      key: key
    })
  }
  
  // Test finding QR sets
  const baggages = await db.baggage.findMany({
    select: {
      id: true,
      reference: true,
      setId: true,
      type: true
    },
    take: 5
  })
  
  console.log('\n=== QR SETS ===')
  const setsMap = new Map<string, string[]>()
  for (const b of baggages) {
    const setId = b.setId || b.reference.split('-')[0]
    if (!setsMap.has(setId)) setsMap.set(setId, [])
    setsMap.get(setId)!.push(b.reference)
  }
  
  for (const [setId, refs] of setsMap) {
    console.log(`Set ${setId}: ${refs.join(', ')}`)
  }
}

main().catch(console.error).finally(() => process.exit(0))
