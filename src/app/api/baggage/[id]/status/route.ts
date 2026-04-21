import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

// PATCH - Update baggage status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();
    if (!user || (user.role !== 'superadmin' && user.role !== 'admin' && user.role !== 'agency')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['pending_activation', 'active', 'scanned', 'lost', 'found', 'blocked'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Update using raw SQL
    await db.$executeRaw`
      UPDATE Baggage SET status = ${status} WHERE id = ${id}
    `;

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating baggage status:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du statut' },
      { status: 500 }
    );
  }
}
