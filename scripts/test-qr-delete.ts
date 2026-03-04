import { db } from '../src/lib/db'

async function main() {
  // 1. Create test QR codes
  console.log('=== Creating test QR codes ===')
  const test1 = await db.baggage.create({
    data: {
      reference: 'TESTQR-AAAA01',
      type: 'hajj',
      baggageIndex: 1,
      baggageType: 'cabine',
      status: 'pending_activation'
    }
  })
  const test2 = await db.baggage.create({
    data: {
      reference: 'TESTQR-AAAA02',
      type: 'hajj',
      baggageIndex: 2,
      baggageType: 'soute',
      status: 'pending_activation'
    }
  })
  const test3 = await db.baggage.create({
    data: {
      reference: 'TESTQR-AAAA03',
      type: 'hajj',
      baggageIndex: 3,
      baggageType: 'soute',
      status: 'pending_activation'
    }
  })
  console.log('Created 3 test baggages with prefix TESTQR')
  
  // 2. Simulate the DELETE logic
  const setId = 'TESTQR'
  console.log('\n=== Simulating DELETE for set:', setId)
  
  const whereClause = {
    OR: [
      { setId: setId },
      { reference: { startsWith: `${setId}-` } }
    ]
  }
  
  const baggages = await db.baggage.findMany({
    where: whereClause,
    select: { id: true, reference: true }
  })
  
  console.log('Found baggages:', baggages.map(b => b.reference))
  
  if (baggages.length > 0) {
    const baggageIds = baggages.map(b => b.id)
    const result = await db.baggage.deleteMany({
      where: { id: { in: baggageIds } }
    })
    console.log('Deleted:', result.count, 'baggages')
  }
  
  // 3. Verify deletion
  const remaining = await db.baggage.findMany({
    where: { reference: { startsWith: 'TESTQR' } }
  })
  console.log('Remaining test baggages:', remaining.length)
  console.log(remaining.length === 0 ? 'SUCCESS: All deleted!' : 'FAILURE: Some remain!')
}

main().catch(console.error).finally(() => process.exit(0))
