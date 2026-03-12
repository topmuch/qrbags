import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List all baggages for an agency
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get('agencyId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const grouped = searchParams.get('grouped'); // New parameter for grouped view

    if (!agencyId) {
      return NextResponse.json(
        { error: 'Agency ID is required', baggages: [], stats: { total: 0, pending: 0, active: 0, scanned: 0, lost: 0, found: 0 } },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = { agencyId };

    if (status && status !== 'all') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { reference: { contains: search } },
        { travelerFirstName: { contains: search } },
        { travelerLastName: { contains: search } },
        { setId: { contains: search } },
      ];
    }

    let baggages;
    try {
      baggages = await db.baggage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
    } catch (dbError) {
      console.error('Database error fetching baggages:', dbError);
      // Return empty response instead of crashing
      return NextResponse.json({
        baggages: [],
        stats: { total: 0, pending: 0, active: 0, scanned: 0, lost: 0, found: 0 },
        error: 'Database temporarily unavailable'
      });
    }

    // Calculate stats
    const stats = {
      total: baggages.length,
      pending: baggages.filter(b => b.status === 'pending_activation').length,
      active: baggages.filter(b => b.status === 'active').length,
      scanned: baggages.filter(b => b.status === 'scanned').length,
      lost: baggages.filter(b => b.status === 'lost').length,
      found: baggages.filter(b => b.status === 'found').length,
    };

    // If grouped view is requested, group by setId
    if (grouped === 'true') {
      const groups: Record<string, {
        setId: string | null;
        travelerFirstName: string | null;
        travelerLastName: string | null;
        whatsappOwner: string | null;
        type: string;
        createdAt: Date;
        baggages: typeof baggages;
      }> = {};

      baggages.forEach(baggage => {
        const groupKey = baggage.setId || `single-${baggage.id}`;

        if (!groups[groupKey]) {
          groups[groupKey] = {
            setId: baggage.setId,
            travelerFirstName: baggage.travelerFirstName,
            travelerLastName: baggage.travelerLastName,
            whatsappOwner: baggage.whatsappOwner,
            type: baggage.type,
            createdAt: baggage.createdAt,
            baggages: []
          };
        }
        groups[groupKey].baggages.push(baggage);
      });

      // Convert to array and sort
      const groupedBaggages = Object.values(groups).sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return NextResponse.json({
        baggages,
        groupedBaggages,
        stats
      });
    }

    return NextResponse.json({
      baggages,
      stats
    });

  } catch (error) {
    console.error('Get baggages error:', error);
    // Return a valid response structure even on error
    return NextResponse.json({
      error: 'Internal server error',
      baggages: [],
      stats: { total: 0, pending: 0, active: 0, scanned: 0, lost: 0, found: 0 }
    }, { status: 500 });
  }
}
