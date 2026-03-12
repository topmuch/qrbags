import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

// GET - Get all activated clients for marketing
export async function GET(request: NextRequest) {
  try {
    const user = await getSession();

    if (!user || user.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    // Filters
    const type = searchParams.get('type'); // 'hajj', 'voyageur', or null for all
    const status = searchParams.get('status'); // 'active', 'expiring_soon', 'expired', or null for all
    const agencyId = searchParams.get('agencyId');
    const dateRange = searchParams.get('dateRange'); // '30', '90', or null for all
    const search = searchParams.get('search');

    // Build where clause
    const where: {
      status: string;
      type?: string;
      agencyId?: string;
      createdAt?: { gte?: Date };
      OR?: Array<{ travelerFirstName?: { contains: string }; travelerLastName?: { contains: string }; whatsappOwner?: { contains: string }; reference?: { contains: string } }>;
    } = {
      status: 'active' // Only activated baggages
    };

    if (type && type !== 'all') {
      where.type = type;
    }

    if (agencyId && agencyId !== 'all') {
      where.agencyId = agencyId;
    }

    // Date range filter
    if (dateRange) {
      const days = parseInt(dateRange);
      const date = new Date();
      date.setDate(date.getDate() - days);
      where.createdAt = { gte: date };
    }

    // Search filter
    if (search) {
      where.OR = [
        { travelerFirstName: { contains: search } },
        { travelerLastName: { contains: search } },
        { whatsappOwner: { contains: search } },
        { reference: { contains: search } }
      ];
    }

    // Get all matching baggages
    let baggages = await db.baggage.findMany({
      where,
      include: {
        agency: {
          select: { id: true, name: true, slug: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate status based on expiration
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);

    // Filter by expiration status if provided
    if (status && status !== 'all') {
      baggages = baggages.filter(b => {
        if (!b.expiresAt) return false;

        if (status === 'active') {
          return b.expiresAt > sevenDaysFromNow;
        } else if (status === 'expiring_soon') {
          return b.expiresAt <= sevenDaysFromNow && b.expiresAt > now;
        } else if (status === 'expired') {
          return b.expiresAt <= now;
        }
        return true;
      });
    }

    // Calculate stats
    const stats = {
      total: baggages.length,
      hajj: baggages.filter(b => b.type === 'hajj').length,
      voyageur: baggages.filter(b => b.type === 'voyageur').length,
      active: baggages.filter(b => b.expiresAt && b.expiresAt > sevenDaysFromNow).length,
      expiringSoon: baggages.filter(b => b.expiresAt && b.expiresAt <= sevenDaysFromNow && b.expiresAt > now).length,
      expired: baggages.filter(b => b.expiresAt && b.expiresAt <= now).length
    };

    // Transform data for frontend
    const clients = baggages.map(b => {
      let computedStatus = 'active';
      if (b.expiresAt) {
        if (b.expiresAt <= now) {
          computedStatus = 'expired';
        } else if (b.expiresAt <= sevenDaysFromNow) {
          computedStatus = 'expiring_soon';
        }
      }

      return {
        id: b.id,
        reference: b.reference,
        fullName: `${b.travelerFirstName || ''} ${b.travelerLastName || ''}`.trim() || 'Non renseigné',
        firstName: b.travelerFirstName || '',
        lastName: b.travelerLastName || '',
        whatsapp: b.whatsappOwner || '',
        type: b.type,
        activationDate: b.createdAt,
        expirationDate: b.expiresAt,
        status: computedStatus,
        agency: b.agency ? { id: b.agency.id, name: b.agency.name } : null,
        marketingOptin: b.marketingOptin,
        lastContactedAt: b.lastContactedAt
      };
    });

    // Get all agencies for filter dropdown
    const agencies = await db.agency.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({
      clients,
      stats,
      agencies
    });
  } catch (error) {
    console.error('Error fetching marketing data:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des données marketing' },
      { status: 500 }
    );
  }
}

// PUT - Update last contacted date
export async function PUT(request: NextRequest) {
  try {
    const user = await getSession();

    if (!user || user.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { baggageId } = body;

    if (!baggageId) {
      return NextResponse.json(
        { error: 'ID bagage requis' },
        { status: 400 }
      );
    }

    const updated = await db.baggage.update({
      where: { id: baggageId },
      data: { lastContactedAt: new Date() }
    });

    return NextResponse.json({
      success: true,
      lastContactedAt: updated.lastContactedAt
    });
  } catch (error) {
    console.error('Error updating contact date:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}
