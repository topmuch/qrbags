import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

// Baggage row type
interface BaggageRow {
  id: string;
  reference: string;
  type: string;
  agencyId: string | null;
  travelerFirstName: string | null;
  travelerLastName: string | null;
  whatsappOwner: string | null;
  status: string;
  createdAt: string;
  expiresAt: string | null;
}

// Agency row type
interface AgencyRow {
  id: string;
  name: string;
  slug: string;
}

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
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const agencyId = searchParams.get('agencyId');
    const dateRange = searchParams.get('dateRange');
    const search = searchParams.get('search');

    // Build query conditions
    let whereConditions = ['status = \'active\''];
    const params: (string | number)[] = [];

    if (type && type !== 'all') {
      whereConditions.push('type = ?');
      params.push(type);
    }

    if (agencyId && agencyId !== 'all') {
      whereConditions.push('agencyId = ?');
      params.push(agencyId);
    }

    // Date range filter
    if (dateRange) {
      const days = parseInt(dateRange);
      const date = new Date();
      date.setDate(date.getDate() - days);
      whereConditions.push('createdAt >= ?');
      params.push(date.toISOString());
    }

    // Search filter
    if (search) {
      whereConditions.push('(travelerFirstName LIKE ? OR travelerLastName LIKE ? OR whatsappOwner LIKE ? OR reference LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get all matching baggages using raw SQL
    const baggages = await db.$queryRawUnsafe<BaggageRow[]>(
      `SELECT
        id, reference, type, agencyId,
        travelerFirstName, travelerLastName, whatsappOwner,
        status, createdAt, expiresAt
       FROM Baggage
       WHERE ${whereClause}
       ORDER BY createdAt DESC`,
      ...params
    );

    // Get agencies
    const agenciesRaw = await db.$queryRaw<AgencyRow[]>`
      SELECT id, name, slug FROM Agency ORDER BY name ASC
    `;

    // Build agency map
    const agencyMap = new Map<string, AgencyRow>();
    (agenciesRaw || []).forEach(a => agencyMap.set(a.id, a));

    // Calculate status based on expiration
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);

    // Filter by expiration status if provided
    let filteredBaggages = baggages || [];
    if (status && status !== 'all') {
      filteredBaggages = filteredBaggages.filter(b => {
        if (!b.expiresAt) return false;

        const expiresAtDate = new Date(b.expiresAt);
        if (status === 'active') {
          return expiresAtDate > sevenDaysFromNow;
        } else if (status === 'expiring_soon') {
          return expiresAtDate <= sevenDaysFromNow && expiresAtDate > now;
        } else if (status === 'expired') {
          return expiresAtDate <= now;
        }
        return true;
      });
    }

    // Calculate stats
    const stats = {
      total: filteredBaggages.length,
      hajj: filteredBaggages.filter(b => b.type === 'hajj').length,
      voyageur: filteredBaggages.filter(b => b.type === 'voyageur').length,
      active: filteredBaggages.filter(b => b.expiresAt && new Date(b.expiresAt) > sevenDaysFromNow).length,
      expiringSoon: filteredBaggages.filter(b => b.expiresAt && new Date(b.expiresAt) <= sevenDaysFromNow && new Date(b.expiresAt) > now).length,
      expired: filteredBaggages.filter(b => b.expiresAt && new Date(b.expiresAt) <= now).length
    };

    // Transform data for frontend
    const clients = filteredBaggages.map(b => {
      let computedStatus = 'active';
      if (b.expiresAt) {
        const expiresAtDate = new Date(b.expiresAt);
        if (expiresAtDate <= now) {
          computedStatus = 'expired';
        } else if (expiresAtDate <= sevenDaysFromNow) {
          computedStatus = 'expiring_soon';
        }
      }

      const agency = b.agencyId ? agencyMap.get(b.agencyId) : null;

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
        agency: agency ? { id: agency.id, name: agency.name } : null,
        // Removed marketing fields that don't exist in production DB
        marketingOptin: false,
        lastContactedAt: null
      };
    });

    return NextResponse.json({
      clients,
      stats,
      agencies: agenciesRaw || []
    });
  } catch (error) {
    console.error('Error fetching marketing data:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des données marketing' },
      { status: 500 }
    );
  }
}

// PUT - Update last contacted date (disabled - column doesn't exist)
export async function PUT(request: NextRequest) {
  try {
    const user = await getSession();

    if (!user || user.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Feature disabled - column doesn't exist in production
    return NextResponse.json({
      success: true,
      message: 'Contact tracking disabled'
    });
  } catch (error) {
    console.error('Error updating contact date:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}
