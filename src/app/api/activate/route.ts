import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateExpirationDate } from '@/lib/qr';
import { z } from 'zod';

// Validation schema for activation
const activateSchema = z.object({
  reference: z.string().min(1, 'Reference is required'),
  travelerFirstName: z.string().min(1, 'First name is required'),
  travelerLastName: z.string().min(1, 'Last name is required'),
  whatsappOwner: z.string().min(1, 'WhatsApp number is required'),
  airlineName: z.string().optional(),
  flightNumber: z.string().optional(),
  destination: z.string().optional(),
  departureDate: z.string().date().optional(),
  departureTime: z.string().optional(),
  // TRANSPORT-FEATURE: Multi-transport mode support
  transportMode: z.enum(['flight', 'train', 'boat', 'bus']).optional(),
  trainCompany: z.string().optional(),
  trainNumber: z.string().optional(),
  shipName: z.string().optional(),
  shipCabin: z.string().optional(),
  busCompany: z.string().optional(),
  busLineNumber: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = activateSchema.parse(body);

    // Find the baggage by reference
    const baggage = await db.baggage.findUnique({
      where: { reference: validatedData.reference },
      include: { agency: true }
    });

    if (!baggage) {
      return NextResponse.json(
        { error: 'Baggage not found', message: 'Code QR non valide' },
        { status: 404 }
      );
    }

    if (baggage.status !== 'pending_activation') {
      return NextResponse.json(
        { error: 'Already activated', message: 'Ce bagage a déjà été activé' },
        { status: 400 }
      );
    }

    // Determine subtype for expiration calculation
    const subtype = baggage.type === 'voyageur' ? 'sticker' : undefined;

    // Calculate expiration date
    const expiresAt = calculateExpirationDate(baggage.type as 'hajj' | 'voyageur', subtype);

    // Update baggage with traveler info
    const updatedBaggage = await db.baggage.update({
      where: { id: baggage.id },
      data: {
        travelerFirstName: validatedData.travelerFirstName,
        travelerLastName: validatedData.travelerLastName,
        whatsappOwner: validatedData.whatsappOwner,
        airlineName: validatedData.airlineName || null,
        flightNumber: validatedData.flightNumber || null,
        destination: validatedData.destination || null,
        departureDate: validatedData.departureDate ? new Date(validatedData.departureDate + 'T00:00:00') : null,
        departureTime: validatedData.departureTime || null,
        // TRANSPORT-FEATURE: Store transport mode + conditional fields
        transportMode: validatedData.transportMode || 'flight',
        trainCompany: validatedData.trainCompany || null,
        trainNumber: validatedData.trainNumber || null,
        shipName: validatedData.shipName || null,
        shipCabin: validatedData.shipCabin || null,
        busCompany: validatedData.busCompany || null,
        busLineNumber: validatedData.busLineNumber || null,
        status: 'active',
        expiresAt,
      }
    });

    // ─── Activation groupée (Hajj & Voyageur) ───
    // Un voyageur peut posséder plusieurs QR codes générés ensemble (même `setId`).
    // Dès qu'un QR est activé, tous les autres QR du même set en attente
    // d'activation sont activés automatiquement avec les mêmes informations.
    let activatedReferences: string[] = [updatedBaggage.reference];

    if (baggage.setId) {
      const relatedBaggages = await db.baggage.findMany({
        where: {
          setId: baggage.setId,
          status: 'pending_activation'
        }
      });

      for (const related of relatedBaggages) {
        if (related.id !== baggage.id) {
          await db.baggage.update({
            where: { id: related.id },
            data: {
              travelerFirstName: validatedData.travelerFirstName,
              travelerLastName: validatedData.travelerLastName,
              whatsappOwner: validatedData.whatsappOwner,
              departureDate: validatedData.departureDate ? new Date(validatedData.departureDate + 'T00:00:00') : null,
              departureTime: validatedData.departureTime || null,
              airlineName: validatedData.airlineName || null,
              flightNumber: validatedData.flightNumber || null,
              destination: validatedData.destination || null,
              // Même mode de transport que le QR activé (même voyageur, même voyage)
              transportMode: validatedData.transportMode || 'flight',
              trainCompany: validatedData.trainCompany || null,
              trainNumber: validatedData.trainNumber || null,
              shipName: validatedData.shipName || null,
              shipCabin: validatedData.shipCabin || null,
              busCompany: validatedData.busCompany || null,
              busLineNumber: validatedData.busLineNumber || null,
              status: 'active',
              expiresAt,
            }
          });
          activatedReferences.push(related.reference);
        }
      }

      if (activatedReferences.length > 1) {
        console.log(`[ACTIVATE] Activation groupée (${baggage.type}) du set ${baggage.setId}: ${activatedReferences.join(', ')}`);
      }
    }

    return NextResponse.json({
      success: true,
      baggage: {
        id: updatedBaggage.id,
        reference: updatedBaggage.reference,
        type: updatedBaggage.type,
        status: updatedBaggage.status,
        expiresAt: updatedBaggage.expiresAt,
        setId: updatedBaggage.setId,
      },
      // Nombre total de QR activés (principal + liés) pour feedback UI
      activatedCount: activatedReferences.length,
      activatedReferences,
    });

  } catch (error) {
    console.error('Activation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
