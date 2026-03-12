import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Baggage row type
interface BaggageRow {
  id: string;
  reference: string;
  type: string;
  agencyId: string | null;
  travelerFirstName: string | null;
  travelerLastName: string | null;
  whatsappOwner: string | null;
  baggageIndex: number;
  baggageType: string;
  status: string;
  flightNumber: string | null;
  destination: string | null;
  createdAt: string;
  lastScanDate: string | null;
  lastLocation: string | null;
  declaredLostAt: string | null;
  foundAt: string | null;
}

// Agency row type
interface AgencyRow {
  id: string;
  name: string;
}

// GET - Export baggages to CSV
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get('agencyId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    // Build query conditions
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (agencyId) {
      conditions.push('agencyId = ?');
      params.push(agencyId);
    }
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    if (type) {
      conditions.push('type = ?');
      params.push(type);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Fetch baggages using raw SQL
    const baggages = await db.$queryRawUnsafe<BaggageRow[]>(
      `SELECT
        id, reference, type, agencyId,
        travelerFirstName, travelerLastName, whatsappOwner,
        baggageIndex, baggageType, status,
        flightNumber, destination, createdAt,
        lastScanDate, lastLocation, declaredLostAt, foundAt
       FROM Baggage
       ${whereClause}
       ORDER BY createdAt DESC`,
      ...params
    );

    // Get agencies for name lookup
    const agencies = await db.$queryRaw<AgencyRow[]>`SELECT id, name FROM Agency`;
    const agencyMap = new Map<string, string>();
    (agencies || []).forEach(a => agencyMap.set(a.id, a.name));

    // CSV Headers
    const headers = [
      'Référence',
      'Type',
      'Statut',
      'Pèlerin/Voyageur',
      'WhatsApp',
      'Type Bagage',
      'Numéro',
      'Vol',
      'Destination',
      'Agence',
      'Date Création',
      'Dernier Scan',
      'Lieu',
      'Déclaré Perdu',
      'Retrouvé',
    ];

    // CSV Rows
    const rows = (baggages || []).map(b => [
      b.reference,
      b.type === 'hajj' ? 'Hajj' : 'Voyageur',
      getStatusLabel(b.status),
      `${b.travelerFirstName || ''} ${b.travelerLastName || ''}`.trim() || '-',
      b.whatsappOwner || '-',
      b.baggageType === 'cabine' ? 'Cabine' : 'Soute',
      b.baggageIndex.toString(),
      b.flightNumber || '-',
      b.destination || '-',
      b.agencyId ? (agencyMap.get(b.agencyId) || '-') : '-',
      new Date(b.createdAt).toLocaleDateString('fr-FR'),
      b.lastScanDate ? new Date(b.lastScanDate).toLocaleDateString('fr-FR') : '-',
      b.lastLocation || '-',
      b.declaredLostAt ? new Date(b.declaredLostAt).toLocaleDateString('fr-FR') : '-',
      b.foundAt ? new Date(b.foundAt).toLocaleDateString('fr-FR') : '-',
    ]);

    // Build CSV content
    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(';')),
    ].join('\n');

    // Create response with CSV file
    const filename = `qrbag-export-${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending_activation: 'En attente',
    active: 'Actif',
    scanned: 'Scanné',
    lost: 'Perdu',
    found: 'Retrouvé',
    blocked: 'Bloqué',
  };
  return labels[status] || status;
}
