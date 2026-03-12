import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/session';

// GET - Get agency profile
export async function GET() {
  try {
    const user = await getSession();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Get full agency data
    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      include: { agency: true }
    });

    if (!fullUser || !fullUser.agency) {
      return NextResponse.json(
        { error: 'Agence non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      agency: fullUser.agency,
      user: {
        id: fullUser.id,
        name: fullUser.name,
        email: fullUser.email
      }
    });
  } catch (error) {
    console.error('Error fetching agency profile:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du profil' },
      { status: 500 }
    );
  }
}

// PUT - Update agency profile
export async function PUT(request: NextRequest) {
  try {
    const user = await getSession();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Get user with agency
    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      include: { agency: true }
    });

    if (!fullUser || !fullUser.agency) {
      return NextResponse.json(
        { error: 'Agence non trouvée' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, email, phone, address, logo, passwordChange } = body;

    // Update agency info
    const updateData: {
      name?: string;
      email?: string | null;
      phone?: string | null;
      address?: string | null;
      logo?: string | null;
    } = {};

    if (name) updateData.name = name;
    if (email !== undefined) updateData.email = email || null;
    if (phone !== undefined) updateData.phone = phone || null;
    if (address !== undefined) updateData.address = address || null;
    if (logo !== undefined) updateData.logo = logo || null;

    // Update agency
    const updatedAgency = await db.agency.update({
      where: { id: fullUser.agency.id },
      data: updateData
    });

    // Handle password change if requested
    if (passwordChange && passwordChange.currentPassword && passwordChange.newPassword) {
      // Verify current password
      const isValidPassword = await bcrypt.compare(passwordChange.currentPassword, fullUser.password || '');
      
      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'Mot de passe actuel incorrect' },
          { status: 400 }
        );
      }

      // Validate new password
      if (passwordChange.newPassword.length < 6) {
        return NextResponse.json(
          { error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' },
          { status: 400 }
        );
      }

      // Hash and update password
      const hashedPassword = await bcrypt.hash(passwordChange.newPassword, 10);
      await db.user.update({
        where: { id: fullUser.id },
        data: { password: hashedPassword }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      agency: updatedAgency
    });
  } catch (error) {
    console.error('Error updating agency profile:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du profil' },
      { status: 500 }
    );
  }
}
