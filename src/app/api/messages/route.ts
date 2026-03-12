import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendEmail, getSuperAdminMessageEmailTemplate, getEmailSettings } from '@/lib/email';

// Messages API - Contact, Partenaire, Commande Agence
// GET - Fetch all messages with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: Record<string, string | boolean> = {};
    if (type && type !== 'all') where.type = type;
    if (status && status !== 'all') where.status = status;

    const messages = await db.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Get unread count
    const unreadCount = await db.message.count({
      where: { status: 'non_lu' },
    });

    return NextResponse.json({ messages, unreadCount });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des messages' },
      { status: 500 }
    );
  }
}

// POST - Create a new message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, senderName, senderEmail, senderPhone, agencyId, recipientAgencyId, subject, content } = body;

    if (!type || !content) {
      return NextResponse.json(
        { error: 'Type et contenu requis' },
        { status: 400 }
      );
    }

    const message = await db.message.create({
      data: {
        type,
        senderName: senderName || null,
        senderEmail: senderEmail || null,
        senderPhone: senderPhone || null,
        agencyId: agencyId || null,
        recipientAgencyId: recipientAgencyId || null,
        subject: subject || null,
        content: typeof content === 'string' ? content : JSON.stringify(content),
        status: 'non_lu',
      },
    });

    // Send email notification to SuperAdmins
    try {
      const emailSettings = await getEmailSettings();
      
      if (emailSettings && emailSettings.provider === 'smtp') {
        // Get all superadmin users
        const superAdmins = await db.user.findMany({
          where: { role: 'superadmin' },
          select: { email: true, name: true }
        });

        if (superAdmins.length > 0) {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
          const messagesUrl = `${baseUrl}/admin/messages`;
          
          const template = getSuperAdminMessageEmailTemplate(
            type,
            senderName || 'Non renseigné',
            senderEmail || 'Non renseigné',
            senderPhone || '',
            subject || '',
            typeof content === 'string' ? content : JSON.stringify(content, null, 2),
            messagesUrl
          );

          // Send to all superadmins
          for (const admin of superAdmins) {
            try {
              await sendEmail({
                to: admin.email,
                subject: `📬 QRBag - Nouveau message (${type})`,
                html: template.html,
                text: template.text,
                type: 'notification',
              });
            } catch (emailError) {
              console.error('Failed to send email to:', admin.email, emailError);
            }
          }
          
          console.log('✅ Email notifications sent to SuperAdmins');
        }
      }
    } catch (emailError) {
      console.error('❌ Failed to send email notification:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du message' },
      { status: 500 }
    );
  }
}

// PUT - Update message status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'ID et statut requis' },
        { status: 400 }
      );
    }

    const message = await db.message.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error('Error updating message:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a message
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID requis' },
        { status: 400 }
      );
    }

    await db.message.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}
