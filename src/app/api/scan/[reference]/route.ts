import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateWhatsAppMessage, analyzeScanSuspicion } from '@/lib/groq';
import { GROQ_AI_ENABLED, GROQ_SCAN_GUARD_ENABLED, GROQ_AUTO_TRANSLATE_ENABLED } from '@/lib/config';
import { isFeatureEnabled } from '@/lib/features';
import { logMetric } from '@/lib/logger';
import { detectLocaleFromHeaders, LANGUAGE_COOKIE_NAME, LANGUAGE_COOKIE_MAX_AGE_DAYS } from '@/lib/i18n';
import { detectScanContext } from '@/lib/scan-context';
import type { Language } from '@/lib/i18n';

// GET - Retrieve baggage info for scan page
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;

    const baggage = await db.baggage.findUnique({
      where: { reference },
      include: { agency: true }
    });

    if (!baggage) {
      return NextResponse.json({
        status: 'not_found',
        message: 'Code QR non valide',
        theme: 'error'
      });
    }

    // Check status - redirect to activation if pending
    if (baggage.status === 'pending_activation') {
      return NextResponse.json({
        status: 'pending_activation',
        type: baggage.type, // Important: return type for redirect
        message: 'Ce bagage doit être activé',
        theme: baggage.type === 'hajj' ? 'hajj' : 'voyageur'
      });
    }

    if (baggage.status === 'blocked') {
      return NextResponse.json({
        status: 'blocked',
        message: 'Ce bagage a été bloqué',
        theme: 'error'
      });
    }

    // Check expiration
    if (baggage.expiresAt && new Date() > baggage.expiresAt) {
      return NextResponse.json({
        status: 'expired',
        message: 'Ce bagage a expiré',
        theme: 'error',
        expiredAt: baggage.expiresAt.toISOString(),
        agency: baggage.agency?.name || null,
        baggage: {
          type: baggage.type,
          travelerName: `${baggage.travelerFirstName} ${baggage.travelerLastName}`
        }
      });
    }

    // Check if baggage is declared lost (but not yet found)
    const isDeclaredLost = baggage.declaredLostAt && !baggage.foundAt;

    // AI-FEATURE: Feature #3 — Detect locale and set cookie for server-side i18n
    let detectedLocale: Language = 'fr';
    try {
      if (GROQ_AI_ENABLED && GROQ_AUTO_TRANSLATE_ENABLED) {
        const autoTranslateEnabled = await isFeatureEnabled('auto_translate').catch(() => false);
        if (autoTranslateEnabled) {
          detectedLocale = detectLocaleFromHeaders(request.headers);
        }
      }
    } catch {
      // Silent fallback to 'fr'
    }

    // Return baggage info
    let theme;
    if (isDeclaredLost) {
      theme = 'lost-urgent'; // Special theme for declared lost baggage
    } else {
      theme = baggage.type === 'hajj'
        ? (baggage.status === 'lost' ? 'lost-hajj' : 'hajj')
        : (baggage.status === 'lost' ? 'lost-voyageur' : 'voyageur');
    }

    const response = NextResponse.json(
      {
      status: isDeclaredLost ? 'lost' : 'active',
      theme,
      type: baggage.type,
      // TRANSPORT-FEATURE: Include transportMode + conditional fields
      baggage: {
        reference: baggage.reference,
        type: baggage.type,
        travelerName: `${baggage.travelerFirstName} ${baggage.travelerLastName}`,
        baggageIndex: baggage.baggageIndex,
        baggageType: baggage.baggageType,
        status: baggage.status,
        transportMode: baggage.transportMode || 'flight',
        airlineName: baggage.airlineName,
        flightNumber: baggage.flightNumber,
        trainCompany: baggage.trainCompany,
        trainNumber: baggage.trainNumber,
        shipName: baggage.shipName,
        shipCabin: baggage.shipCabin,
        busCompany: baggage.busCompany,
        busLineNumber: baggage.busLineNumber,
        destination: baggage.destination,
        agency: baggage.agency?.name || null,
        whatsappOwner: baggage.whatsappOwner || null,
        declaredLostAt: baggage.declaredLostAt,
        foundAt: baggage.foundAt,
        createdAt: baggage.createdAt?.toISOString() || null,
        departureDate: baggage.departureDate?.toISOString() || null,
        departureTime: baggage.departureTime || null,
      }
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    }
    );

    // AI-FEATURE: Set qrbag_locale cookie (7 days) so server can detect language on next request
    try {
      response.cookies.set(LANGUAGE_COOKIE_NAME, detectedLocale, {
        path: '/',
        maxAge: LANGUAGE_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60,
        sameSite: 'lax',
        httpOnly: false, // Client needs to read it for localStorage sync
      });
    } catch {
      // Cookie setting can fail in some environments — silent
    }

    return response;

  } catch (error) {
    console.error('Scan error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Log scan and generate WhatsApp link
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;
    const body = await request.json();

    const { location, finderName, finderPhone, message, latitude, longitude, country, city, ipAddress, context: manualContext } = body;

    const baggage = await db.baggage.findUnique({
      where: { reference }
    });

    if (!baggage || !baggage.whatsappOwner) {
      return NextResponse.json(
        { error: 'Baggage not found or not activated' },
        { status: 404 }
      );
    }

    // AI-FEATURE: Feature #2 — Scan Guard (Anti-Doublon)
    let isFlagged = false;
    let scanGuardAnalysis: Record<string, unknown> | undefined;

    try {
      if (GROQ_AI_ENABLED && GROQ_SCAN_GUARD_ENABLED) {
        const scanGuardEnabled = await isFeatureEnabled('scan_guard').catch(() => false);
        if (scanGuardEnabled) {
          // Fetch recent scans for this baggage (last 30 min)
          const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
          const recentScans = await db.scanLog.findMany({
            where: {
              baggageId: baggage.id,
              createdAt: { gte: thirtyMinAgo },
            },
            select: {
              ipAddress: true,
              city: true,
              country: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
          });

          const scannerIp = ipAddress ||
            request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
            request.headers.get('x-real-ip')?.trim() ||
            'unknown';

          const guardResult = await analyzeScanSuspicion({
            reference: baggage.reference,
            scannerIp,
            userAgent: request.headers.get('user-agent') || undefined,
            city: city || undefined,
            country: country || undefined,
            recentScans: recentScans.map((s) => ({
              ip: s.ipAddress || 'unknown',
              city: s.city || undefined,
              country: s.country || undefined,
              createdAt: s.createdAt.toISOString(),
            })),
          });

          // Store analysis for ALL analyzed scans (not just flagged) for audit trail
          if (guardResult.analyzed && guardResult.analysis) {
            scanGuardAnalysis = {
              feature: 'scan_guard',
              isSuspicious: guardResult.analysis.isSuspicious,
              reason: guardResult.analysis.reason,
              confidence: guardResult.analysis.confidence,
              analyzedAt: guardResult.analysis.analyzedAt,
              latencyMs: guardResult.latencyMs,
            };

            logMetric('groq', 'scan_guard', guardResult.latencyMs, true, {
              key: reference,
              details: `flagged=${guardResult.analysis.isSuspicious}, confidence=${guardResult.analysis.confidence}, reason=${guardResult.analysis.reason.substring(0, 50)}`,
            });

            if (guardResult.analysis.isSuspicious) {
              isFlagged = true;

              // Return discreet message — don't reveal that it was flagged
              return NextResponse.json({
                success: true,
                flagged: true,
                message: 'Votre signalement est en cours de vérification.',
              });
            }
          } else {
            logMetric('groq', 'scan_guard', guardResult.latencyMs, false, {
              key: reference,
              details: 'analysis_failed',
            });
          }
        }
      }
    } catch (error) {
      // Scan guard failure = fail-open, never blocks the scan
      console.warn('[Groq/ScanGuard] Error → fail-open:', error instanceof Error ? error.message : 'unknown');
    }

    // ─── IA: Générer le message WhatsApp via Groq (si activé) ───
    let aiMessageContent: string | null = null;
    let aiGenerated = false;
    let aiLatencyMs: number | null = null;

    try {
      // ─── Double check: env var (kill switch) + DB feature flag ───
      if (!GROQ_AI_ENABLED) {
        console.log('[Groq/WhatsApp] Désactivé via GROQ_AI_ENABLED=false (env var)');
      } else {
        const groqFlag = await db.featureFlag.findUnique({
          where: { key: 'groq_api' },
          select: { enabled: true },
        });

        if (groqFlag?.enabled) {
          // AI-FEATURE: Feature #3 — Detect locale for message language
          const detectedLocale = detectLocaleFromHeaders(request.headers);
          const localeMap: Record<string, string> = { fr: 'fr-FR', en: 'en-US', ar: 'ar-SA' };
          const localeStr = localeMap[detectedLocale] || 'fr-FR';

          const scanTime = new Date().toLocaleTimeString(localeStr, {
            hour: '2-digit',
            minute: '2-digit',
          });

          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://qrbags.com';

          const aiResult = await generateWhatsAppMessage({
            reference: baggage.reference,
            location: {
              city: city || baggage.destination || 'Inconnue',
              country: country || '',
            },
            time: scanTime,
            link: `${appUrl}/suivi/${baggage.reference}`,
            language: detectedLocale,
          });

          if (aiResult.generated && aiResult.message) {
            aiMessageContent = aiResult.message;
            aiGenerated = true;
            aiLatencyMs = aiResult.latencyMs;
            logMetric('groq', 'generate_message', aiResult.latencyMs, true, {
              key: baggage.reference,
            });
          } else {
            logMetric('groq', 'generate_message', aiResult.latencyMs, false, {
              key: baggage.reference,
              details: 'fallback',
            });
          }
        }
      }
    } catch (error) {
      // Ne bloque JAMAIS le flux de scan — fallback silencieux
      logMetric('groq', 'generate_message', 0, false, {
        key: baggage.reference,
        details: error instanceof Error ? error.message : 'unknown',
      });
    }

    // ─── Détecter le contexte du scan (auto + manual override) ───
    const detectedContext = manualContext
      ? manualContext
      : detectScanContext(
          {
            departureDate: baggage.departureDate,
            destination: baggage.destination,
          },
          {
            city: city || location,
            address: location,
            speed: null,
            poiType: null,
          }
        ).context;

    // Create scan log with AI tracking
    await db.scanLog.create({
      data: {
        baggageId: baggage.id,
        location,
        message,
        latitude,
        longitude,
        country,
        city,
        ipAddress,
        // refonte-7: le message WhatsApp utilise désormais un template fixe (plus de message IA)
        aiMessageUsed: false,
        groqUsed: aiGenerated || !!scanGuardAnalysis,
        groqLatencyMs: aiLatencyMs,
        // AI-FEATURE: Store scan guard analysis in aiAnalysis JSON
        aiAnalysis: scanGuardAnalysis ? JSON.parse(JSON.stringify(scanGuardAnalysis)) : undefined,
        // Contexte du scan
        context: detectedContext,
        // Infos du trouveur (pour la page suivi)
        finderName: finderName?.trim() || null,
        finderPhone: finderPhone?.trim() || null,
      }
    });

    // Check if baggage is declared lost (urgent case)
    const isDeclaredLost = baggage.declaredLostAt && !baggage.foundAt;

    // Update baggage with last scan info and founder information
    const updateData: Record<string, unknown> = {
      lastScanDate: new Date(),
      lastLocation: location,
      status: baggage.status === 'active' ? 'scanned' : baggage.status,
    };

    // Store founder information if provided
    if (finderName && finderName.trim()) {
      updateData.founderName = finderName.trim();
      updateData.founderAt = new Date();
    }
    
    if (finderPhone && finderPhone.trim()) {
      updateData.founderPhone = finderPhone.trim();
    }

    // If baggage was declared lost and founder provides info, this is an important recovery step
    // Keep the 'lost' status until agency confirms recovery

    await db.baggage.update({
      where: { id: baggage.id },
      data: updateData
    });

    // ─── refonte-7: Nouveau template de message WhatsApp envoyé au propriétaire ───
    // Le frontend construit sa propre URL wa.me via la clé i18n `whatsapp.found_message`.
    // Ce `whatsappUrl` backend est retourné pour les consommateurs API / audit.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://qrbags.com';
    const trackingUrl = `${appUrl}/suivi/${reference}`;

    // [Prénom] — prénom du propriétaire
    const ownerFirstName = baggage.travelerFirstName?.trim() || 'à toi';

    // [Type] — label du type de bagage (FR par défaut côté backend)
    const typeLabel = baggage.type === 'hajj' ? 'Hajj & Omra' : 'Voyageur';

    // [Lieu] — où le bagage a été trouvé
    const lieu = city || location || 'lieu non précisé';

    // [Adresse] — position précise (lien Google Maps si GPS, sinon lieu, sinon fallback)
    const address = latitude && longitude
      ? `https://www.google.com/maps?q=${latitude},${longitude}`
      : (location || 'non précisée');

    // [Nom] + téléphone du trouveur (avec fallbacks sûrs)
    const finderNameDisplay = finderName?.trim() || 'Une personne';
    const finderPhoneDisplay = finderPhone?.trim() || 'numéro non précisé';

    const whatsappText =
      `🎉 Bonne nouvelle ${ownerFirstName} !\n\n` +
      `Quelqu'un a trouvé ton bagage ${typeLabel} à ${lieu} !\n` +
      `📍 Il est actuellement à ${address}\n` +
      `👤 La personne qui l'a trouvé s'appelle ${finderNameDisplay}\n` +
      `📞 Appelle-le vite au ${finderPhoneDisplay}\n` +
      `💬 Ou écris-lui sur WhatsApp\n` +
      `Tu peux aussi voir tous les détails ici :\n` +
      `👉 ${trackingUrl}\n` +
      `Ne panique pas, tout va bien se passer ! 💪\n` +
      `L'équipe QRBag`;

    // Clean phone number
    const phone = baggage.whatsappOwner.replace(/[^0-9]/g, '');
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(whatsappText)}`;

    return NextResponse.json({
      success: true,
      whatsappUrl,
      isDeclaredLost,
      aiMessageUsed: false,
    });

  } catch (error) {
    console.error('Scan POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
