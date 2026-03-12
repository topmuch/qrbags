import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List all travelers with their baggages
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const agencyId = searchParams.get('agencyId');
    const search = searchParams.get('search');

    // Build where clause for baggages
    const where: Record<string, unknown> = {
      travelerFirstName: { not: null }, // Only activated baggages
    };

    if (type && type !== 'all') {
      where.type = type;
    }

    if (agencyId && agencyId !== 'all') {
      where.agencyId = agencyId;
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { travelerFirstName: { contains: search } },
        { travelerLastName: { contains: search } },
        { reference: { contains: search.toUpperCase() } },
      ];
    }

    // Get all activated baggages
    const baggages = await db.baggage.findMany({
      where,
      include: { agency: true },
      orderBy: { createdAt: 'desc' },
    });

    // Group by traveler (first name + last name + whatsapp)
    const travelersMap = new Map<string, {
      id: string;
      firstName: string;
      lastName: string;
      whatsapp: string;
      type: string;
      agencyName: string | null;
      baggages: typeof baggages;
      lastScan: Date | null;
    }>();

    baggages.forEach((baggage) => {
      const key = `${baggage.travelerFirstName}_${baggage.travelerLastName}_${baggage.whatsappOwner}`;

      if (!travelersMap.has(key)) {
        travelersMap.set(key, {
          id: key,
          firstName: baggage.travelerFirstName || '',
          lastName: baggage.travelerLastName || '',
          whatsapp: baggage.whatsappOwner || '',
          type: baggage.type,
          agencyName: baggage.agency?.name || null,
          baggages: [],
          lastScan: null,
        });
      }

      const traveler = travelersMap.get(key)!;
      traveler.baggages.push(baggage);

      // Update last scan
      if (baggage.lastScanDate) {
        if (!traveler.lastScan || new Date(baggage.lastScanDate) > traveler.lastScan) {
          traveler.lastScan = new Date(baggage.lastScanDate);
        }
      }
    });

    // Convert to array
    const travelers = Array.from(travelersMap.values()).map((traveler) => ({
      ...traveler,
      baggages: traveler.baggages.map((b) => ({
        id: b.id,
        reference: b.reference,
        type: b.type,
        baggageIndex: b.baggageIndex,
        baggageType: b.baggageType,
        status: b.status,
        lastScanDate: b.lastScanDate,
        lastLocation: b.lastLocation,
      })),
      lastScan: traveler.lastScan?.toISOString() || null,
    }));

    return NextResponse.json({
      travelers,
      total: travelers.length,
    });

  } catch (error) {
    console.error('Get travelers error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
