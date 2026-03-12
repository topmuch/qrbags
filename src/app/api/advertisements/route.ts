import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

// GET - Get active advertisements for current user/agency
export async function GET() {
  try {
    // Check authentication
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ advertisements: [] });
    }

    const session = await db.session.findUnique({
      where: { id: sessionToken },
      include: { user: true }
    });

    if (!session) {
      return NextResponse.json({ advertisements: [] });
    }

    const user = session.user;
    const now = new Date();

    // Get all active advertisements and filter in JS for simplicity
    const allAds = await db.advertisement.findMany({
      where: {
        status: 'active',
        startDate: { lte: now },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 10
    });

    // Filter by date and targeting
    const advertisements = allAds.filter(ad => {
      // Check end date
      if (ad.endDate && new Date(ad.endDate) < now) {
        return false;
      }

      // Check targeting
      if (ad.targetScope === 'all') {
        return true;
      }
      
      if (ad.targetScope === 'agency' && ad.agencyId === user.agencyId) {
        return true;
      }
      
      if (ad.targetScope === 'agents' && user.role === 'agent') {
        return true;
      }

      return false;
    }).slice(0, 5);

    return NextResponse.json({ advertisements });

  } catch (error) {
    console.error('Error fetching active advertisements:', error);
    return NextResponse.json({ advertisements: [] });
  }
}
