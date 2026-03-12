import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fix database schema by adding missing columns
// This endpoint adds missing columns to the Baggage table
export async function GET(request: NextRequest) {
  try {
    const results: string[] = [];

    // Check and add marketingOptin column
    try {
      await db.$executeRaw`ALTER TABLE Baggage ADD COLUMN marketingOptin BOOLEAN DEFAULT 0`;
      results.push('✅ Added marketingOptin column');
    } catch (e: any) {
      if (e.message?.includes('duplicate column')) {
        results.push('ℹ️ marketingOptin column already exists');
      } else {
        results.push(`⚠️ marketingOptin: ${e.message}`);
      }
    }

    // Check and add lastContactedAt column
    try {
      await db.$executeRaw`ALTER TABLE Baggage ADD COLUMN lastContactedAt DATETIME`;
      results.push('✅ Added lastContactedAt column');
    } catch (e: any) {
      if (e.message?.includes('duplicate column')) {
        results.push('ℹ️ lastContactedAt column already exists');
      } else {
        results.push(`⚠️ lastContactedAt: ${e.message}`);
      }
    }

    // Check current table structure
    const tableInfo = await db.$queryRaw<any[]>`PRAGMA table_info(Baggage)`;
    const columns = tableInfo.map(col => col.name);

    return NextResponse.json({
      success: true,
      message: 'Database schema fix applied',
      results,
      currentColumns: columns
    });

  } catch (error) {
    console.error('Schema fix error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
