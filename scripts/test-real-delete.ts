import { db } from '../src/lib/db'

async function main() {
  // 1. Create a test voyageur
  console.log('=== Creating test voyageur ===')
  const testBaggage = await db.baggage.create({
    data: {
      reference: 'TEST-DELETE-001',
      type: 'voyageur',
      travelerFirstName: 'Test',
      travelerLastName: 'ToDelete',
      whatsappOwner: '+33000000000',
      baggageIndex: 1,
      baggageType: 'cabine',
      status: 'pending_activation'
    }
  })
  console.log('Created:', testBaggage.reference)
  
  // 2. Verify it exists
  const found = await db.baggage.findUnique({
    where: { reference: 'TEST-DELETE-001' }
  })
  console.log('Found:', found ? found.reference : 'NOT FOUND')
  
  // 3. Delete using the same logic as the API
  const keyData = {
    firstName: 'Test',
    lastName: 'ToDelete',
    whatsapp: '+33000000000',
    agencyId: ''
  }
  const key = JSON.stringify(keyData)
  console.log('Delete key:', key)
  
  const whereClause = {
    type: 'voyageur' as const,
    travelerFirstName: keyData.firstName || null,
    travelerLastName: keyData.lastName || null,
    whatsappOwner: keyData.whatsapp || null,
    agencyId: null
  }
  
  const toDelete = await db.baggage.findMany({
    where: whereClause,
    select: { id: true }
  })
  console.log('To delete:', toDelete.length, 'baggages')
  
  if (toDelete.length > 0) {
    const result = await db.baggage.deleteMany({
      where: { id: { in: toDelete.map(b => b.id) } }
    })
    console.log('Deleted:', result.count, 'baggages')
  }
  
  // 4. Verify deletion
  const afterDelete = await db.baggage.findUnique({
    where: { reference: 'TEST-DELETE-001' }
  })
  console.log('After delete:', afterDelete ? 'STILL EXISTS!' : 'SUCCESSFULLY DELETED')
}

main().catch(console.error).finally(() => process.exit(0))
