import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

// GET - Get active advertisements for current user/agency
export async function GET() {
  try {
    // Check authentication using session
    const user = await getSession();

    if (!user) {
      return NextResponse.json({ advertisements: [] });
    }

    const now = new Date();

    // Get all active advertisements
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
    console.error('Error fetching advertisements:', error);
    return NextResponse.json({ advertisements: [] });
  }
}
