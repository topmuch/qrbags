'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Luggage,
  AlertCircle,
  Clock,
  Shield,
  Navigation,
  CheckCircle,
  Plane,
  ArrowRight,
  Sparkles,
  Send,
  AlertTriangle,
  Globe
} from "lucide-react";
import { useTranslation } from '@/hooks/useTranslation';
import { Language, LANGUAGE_NAMES } from '@/lib/i18n';

interface BaggageData {
  status: string;
  message?: string;
  theme?: string;
  type?: string;
  baggage?: {
    reference: string;
    type: string;
    travelerName: string;
    baggageIndex: number;
    baggageType: string;
    status: string;
    flightNumber?: string;
    destination?: string;
    agency?: string;
    whatsappOwner?: string;
    declaredLostAt?: string | null;
    foundAt?: string | null;
  };
}

// Language Selector Component
function LanguageSelector({ lang, setLang }: { lang: Language; setLang: (l: Language) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors text-sm font-medium backdrop-blur-sm"
      >
        <Globe className="w-4 h-4" />
        <span>{LANGUAGE_NAMES[lang]}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 bg-[#1a1a2e] border border-white/20 rounded-xl shadow-2xl overflow-hidden z-50 min-w-[140px] backdrop-blur-sm">
          {(['fr', 'en', 'ar'] as Language[]).map((l) => (
            <button
              key={l}
              onClick={() => {
                setLang(l);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors ${
                lang === l 
                  ? 'bg-white/20 text-white' 
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              {LANGUAGE_NAMES[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Activation Redirect Component
function ActivationRedirect({ type, reference, t, lang, setLang }: {
  type: string;
  reference: string;
  t: (key: string, params?: Record<string, string>) => string;
  lang: Language;
  setLang: (l: Language) => void;
}) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          const url = type === 'hajj'
            ? `/hajj/activate?qr=${reference}`
            : `/inscrire?qr=${reference}`;
          router.push(url);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [type, reference, router]);

  const isHajj = type === 'hajj';
  const bgGradient = isHajj
    ? 'from-[#0d5e34] to-[#0a4a2a]'
    : 'from-[#d35400] to-[#b34700]';

  return (
    <main className={`min-h-screen bg-gradient-to-b ${bgGradient} flex items-center justify-center p-4`}>
      <div className="max-w-md w-full bg-white/10 backdrop-blur-sm rounded-xl p-8 text-center border border-white/20">
        {/* Language Selector */}
        <div className="absolute top-4 right-4">
          <LanguageSelector lang={lang} setLang={setLang} />
        </div>

        {/* Welcome Animation */}
        <div className="relative inline-block mb-6">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
            {isHajj ? (
              <Plane className="w-10 h-10 text-white" />
            ) : (
              <Luggage className="w-10 h-10 text-white" />
            )}
          </div>
          <div className="absolute -top-1 -right-1 w-8 h-8 bg-[#ffd700] rounded-full flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[#080c1a]" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">
          {t('common.welcome')}
        </h1>
        <p className="text-white/70 mb-4">
          {t('common.activate_in')}
        </p>

        <div className="bg-white/10 rounded-lg p-4 mb-6">
          <p className="text-white/60 text-sm mb-2">{t('common.baggage_type')}</p>
          <Badge className={`${isHajj ? 'bg-[#1e3a2e] text-green-300' : 'bg-[#7a3e00] text-orange-300'} text-sm px-4 py-1`}>
            {isHajj ? t('common.hajj_label') : t('common.voyageur_label')}
          </Badge>
        </div>

        <p className="text-white/50 text-sm mb-4">
          {t('common.auto_redirect')} <span className="text-white font-bold">{countdown}s</span>
        </p>

        <button
          className="w-full py-3 px-6 bg-white text-[#080c1a] rounded-lg font-semibold hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
          onClick={() => {
            const url = isHajj
              ? `/hajj/activate?qr=${reference}`
              : `/inscrire?qr=${reference}`;
            router.push(url);
          }}
        >
          {t('common.start_activation')}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </main>
  );
}

// Loading Component
function LoadingScreen({ t }: { t: (key: string) => string }) {
  return (
    <main className="min-h-screen bg-[#d35400] flex items-center justify-center">
      <div className="text-center text-white">
        <div className="animate-spin w-12 h-12 border-4 border-white/30 border-t-white rounded-full mx-auto mb-4"></div>
        <p>{t('common.loading')}</p>
      </div>
    </main>
  );
}

// Error Screen
function ErrorScreen({
  type,
  t,
  lang,
  setLang
}: {
  type: string;
  t: (key: string) => string;
  lang: Language;
  setLang: (l: Language) => void;
}) {
  const router = useRouter();

  const errorConfig = {
    not_found: {
      icon: <AlertCircle className="w-10 h-10 text-red-400" />,
      title: t('errors.qr_not_valid'),
      message: t('errors.qr_not_valid_desc')
    },
    blocked: {
      icon: <Shield className="w-10 h-10 text-gray-400" />,
      title: t('errors.baggage_blocked'),
      message: t('errors.baggage_blocked_desc')
    },
    expired: {
      icon: <Clock className="w-10 h-10 text-gray-400" />,
      title: t('errors.protection_expired'),
      message: t('errors.protection_expired_desc')
    }
  };

  const config = errorConfig[type as keyof typeof errorConfig] || errorConfig.not_found;

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#080c1a] to-[#0d1220] flex items-center justify-center p-4 relative">
      {/* Language Selector */}
      <div className="absolute top-4 right-4">
        <LanguageSelector lang={lang} setLang={setLang} />
      </div>

      <div className="max-w-md w-full bg-[#111827] rounded-xl p-8 text-center border border-[#1a2238]">
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          {config.icon}
        </div>
        <h1 className="text-2xl font-bold text-[#e0e6f0] mb-2">{config.title}</h1>
        <p className="text-[#8b9bb4] mb-6">{config.message}</p>
        <button
          className="px-6 py-2 border border-[#1a2238] text-[#8b9bb4] rounded-lg hover:bg-[#1a2238] transition-colors"
          onClick={() => router.push('/')}
        >
          {t('common.back_home')}
        </button>
      </div>
    </main>
  );
}

// Main Scan Page - Voyageur Finder Form with Sequential Flow
export default function ScanPage() {
  const params = useParams();
  const router = useRouter();
  const reference = params.reference as string;

  const { t, lang, setLang, dir } = useTranslation();

  const [baggageData, setBaggageData] = useState<BaggageData | null>(null);
  const [loading, setLoading] = useState(true);

  // Finder form state
  const [finderName, setFinderName] = useState('');
  const [finderPhone, setFinderPhone] = useState('');
  const [otherLocation, setOtherLocation] = useState('');
  const [sharedPosition, setSharedPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLocationWarning, setShowLocationWarning] = useState(false);

  // Check if location is provided
  const hasLocation = sharedPosition !== null || otherLocation.trim().length > 0;
  const isFormComplete = finderName.trim().length > 0 && finderPhone.trim().length > 0;

  useEffect(() => {
    const fetchBaggage = async () => {
      try {
        const response = await fetch(`/api/scan/${reference}`);
        const data = await response.json();
        setBaggageData(data);
      } catch (error) {
        console.error('Error fetching baggage:', error);
        setBaggageData({ status: 'error', message: 'Erreur serveur' });
      } finally {
        setLoading(false);
      }
    };

    fetchBaggage();
  }, [reference]);

  // GPS Location Handler - Enhanced for iOS compatibility
  const handleShareLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      alert(t('errors.geolocation_not_supported'));
      return;
    }

    setIsLoadingLocation(true);
    setShowLocationWarning(false);

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        // iOS-compatible options with longer timeout and high accuracy
        navigator.geolocation.getCurrentPosition(
          resolve,
          (error) => {
            console.error('Geolocation error:', error.code, error.message);
            reject(error);
          },
          {
            enableHighAccuracy: true,  // Required for iOS accuracy
            timeout: 30000,            // 30 seconds for iOS
            maximumAge: 0              // No cached position
          }
        );
      });

      setSharedPosition({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      });
    } catch (error) {
      // Handle specific iOS errors
      const geoError = error as GeolocationPositionError;
      let errorMessage = t('errors.location_failed');

      if (geoError.code === 1) {
        // Permission denied - iOS shows this when user denies or hasn't granted permission
        errorMessage = t('errors.location_permission_denied') || 'Permission de localisation refusée. Veuillez autoriser l\'accès à votre position dans les paramètres de votre navigateur, ou entrez manuellement le lieu ci-dessous.';
        // Auto-focus on manual input for iOS users
        setTimeout(() => {
          const input = document.querySelector('input[placeholder*="lieu"], input[placeholder*="location"]') as HTMLInputElement;
          if (input) input.focus();
        }, 100);
      } else if (geoError.code === 2) {
        // Position unavailable
        errorMessage = t('errors.location_unavailable') || 'Position non disponible. Veuillez entrer le lieu manuellement.';
      } else if (geoError.code === 3) {
        // Timeout
        errorMessage = t('errors.location_timeout') || 'Délai de localisation dépassé. Veuillez entrer le lieu manuellement.';
      }

      alert(errorMessage);
    } finally {
      setIsLoadingLocation(false);
    }
  }, [t]);

  // Generate WhatsApp message in owner's language (French)
  const generateWhatsAppMessage = useCallback((finderName: string, finderPhone: string, locationText: string, mapLink: string) => {
    // Message always in French for the owner
    return encodeURIComponent(
      `📦 *QRBag – Bagage trouvé !*\n\n` +
      `📍 *Référence* : ${reference}\n` +
      `📍 *Lieu* : ${locationText}\n` +
      `🗺️ *Carte* : ${mapLink}\n\n` +
      `👤 *Trouvé par* : ${finderName}\n` +
      `📱 *Contact* : ${finderPhone}\n\n` +
      `👉 Merci de le récupérer rapidement.\n` +
      `*QRBag – Protégez vos bagages, en toute sérénité.*`
    );
  }, [reference]);

  // Main Action Button Handler - Sequential Logic
  const handleMainAction = useCallback(async () => {
    // Step 1: If no location, show warning
    if (!hasLocation) {
      setShowLocationWarning(true);
      return;
    }

    // Step 2: If location but missing info, show warning
    if (!isFormComplete) {
      if (!finderName.trim()) {
        alert(t('finder.first_name').replace(' *', ''));
      } else if (!finderPhone.trim()) {
        alert(t('finder.whatsapp').replace(' *', ''));
      }
      return;
    }

    // Step 3: All good - send WhatsApp
    setIsSubmitting(true);

    try {
      // Log the scan
      await fetch(`/api/scan/${reference}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: otherLocation.trim() || "Non précisé",
          finderName: finderName.trim(),
          finderPhone: finderPhone.trim(),
          message: '',
          latitude: sharedPosition?.lat,
          longitude: sharedPosition?.lng,
        }),
      });

      // Build location info
      const locationText = otherLocation.trim() || "Non précisé";
      const mapLink = sharedPosition
        ? `https://maps.app.goo.gl/?link=https://www.google.com/maps?q=${sharedPosition.lat},${sharedPosition.lng}`
        : "Localisation non partagée";

      // Generate WhatsApp message (always in French for owner)
      const message = generateWhatsAppMessage(finderName, finderPhone, locationText, mapLink);

      // Get owner number or default
      const ownerNumber = baggageData?.baggage?.whatsappOwner?.replace(/\D/g, '') || '33745349339';
      const url = `https://wa.me/${ownerNumber}?text=${message}`;

      // iOS-compatible WhatsApp opening
      // On iOS, window.open can be blocked, so we use window.location.href as fallback
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      if (isIOS) {
        // On iOS, direct navigation works better for WhatsApp
        window.location.href = url;
      } else {
        // On Android and desktop, open in new tab
        const newWindow = window.open(url, '_blank');
        // Fallback if popup was blocked
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          window.location.href = url;
        }
      }
    } catch (error) {
      console.error('Error:', error);
      alert(t('errors.error_occurred'));
    } finally {
      setIsSubmitting(false);
    }
  }, [hasLocation, isFormComplete, finderName, finderPhone, otherLocation, sharedPosition, reference, baggageData, t, generateWhatsAppMessage]);

  // Loading state
  if (loading) {
    return <LoadingScreen t={t} />;
  }

  // Redirect to activation if pending
  if (baggageData?.status === 'pending_activation' && baggageData?.type) {
    return (
      <ActivationRedirect
        type={baggageData.type}
        reference={reference}
        t={t}
        lang={lang}
        setLang={setLang}
      />
    );
  }

  // Error states
  if (baggageData?.status === 'not_found') {
    return <ErrorScreen type="not_found" t={t} lang={lang} setLang={setLang} />;
  }

  if (baggageData?.status === 'blocked') {
    return <ErrorScreen type="blocked" t={t} lang={lang} setLang={setLang} />;
  }

  if (baggageData?.status === 'expired') {
    // Redirect to dedicated expired page with reference info
    const expiredAt = (baggageData as any).expiredAt || '';
    const agencyName = (baggageData as any).agency || '';
    const params = new URLSearchParams({
      ref: reference,
      ...(expiredAt && { expired: expiredAt }),
      ...(agencyName && { agency: agencyName })
    });
    // Use window.location for immediate redirect
    if (typeof window !== 'undefined') {
      window.location.href = `/expired?${params.toString()}`;
    }
    return <LoadingScreen t={t} />;
  }

  // Check if baggage is declared lost (Page 3 - Lost Baggage)
  const baggage = baggageData?.baggage;
  const isDeclaredLost = baggage?.declaredLostAt && !baggage?.foundAt;

  if (isDeclaredLost && baggage) {
    return (
      <main className="min-h-screen bg-[#7a1e1e] flex flex-col items-center justify-center p-4" dir={dir}>
        <div className="max-w-md w-full bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-red-400/30 relative">
          {/* Language Selector */}
          <div className="absolute top-4 right-4">
            <LanguageSelector lang={lang} setLang={setLang} />
          </div>

          {/* Urgent Alert Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-[#b8860b] rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse">
              <AlertTriangle className="h-8 w-8 text-white" />
            </div>
            <div className="bg-red-900/50 border border-red-400/50 rounded-lg p-3 mb-3">
              <p className="text-yellow-300 font-bold text-lg flex items-center justify-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                URGENT
              </p>
            </div>
            <h1 className="text-xl font-bold text-white">{t('finder.lost_baggage_title') || 'Bagage signalé perdu !'}</h1>
            <p className="text-red-200 text-sm mt-2 font-medium">
              ⚠️ {t('finder.lost_baggage_warning') || 'Ce bagage a été signalé comme perdu par l\'agence !'}
            </p>
          </div>

          {/* Baggage Info */}
          <div className="bg-white/10 rounded-lg p-3 mb-6 flex items-center gap-3 border border-red-400/20">
            <div className="w-10 h-10 bg-red-500/30 rounded-full flex items-center justify-center">
              <Luggage className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-medium">{baggage.travelerName}</p>
              <p className="text-white/60 text-sm">{reference}</p>
              {baggage.agency && (
                <p className="text-[#b8860b] text-xs font-medium">{baggage.agency}</p>
              )}
            </div>
          </div>

          {/* Step 1: Location */}
          <div className="mb-4">
            <h3 className="text-white font-medium mb-2 flex items-center gap-2">
              <span className="w-6 h-6 bg-red-500/30 rounded-full flex items-center justify-center text-xs">1</span>
              {t('finder.where_is_baggage')}
            </h3>

            {/* GPS Button */}
            {!sharedPosition && (
              <button
                onClick={handleShareLocation}
                disabled={isLoadingLocation}
                className="w-full py-3 px-4 bg-white/20 border border-white/30 text-white rounded-lg font-medium flex items-center justify-center gap-2 mb-3 hover:bg-white/30 transition-colors disabled:opacity-50"
              >
                {isLoadingLocation ? (
                  <>
                    <span className="animate-spin">⏳</span> {t('finder.locating')}
                  </>
                ) : (
                  <>
                    <Navigation className="w-5 h-5" />
                    {t('finder.share_gps')}
                  </>
                )}
              </button>
            )}

            {/* GPS Status */}
            {sharedPosition && (
              <div className="mb-3 p-3 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-white text-sm">
                  {t('finder.position_confirmed')} {sharedPosition.lat.toFixed(4)}, {sharedPosition.lng.toFixed(4)}
                </span>
              </div>
            )}

            {/* Manual Location Input */}
            <input
              type="text"
              placeholder={sharedPosition ? t('finder.location_optional') : t('finder.location_placeholder')}
              value={otherLocation}
              onChange={(e) => {
                setOtherLocation(e.target.value);
                setShowLocationWarning(false);
              }}
              className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:border-[#b8860b]"
            />

            {/* Location Warning */}
            {showLocationWarning && !hasLocation && (
              <div className="mt-2 p-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-200 text-sm">
                  {t('finder.location_warning')}
                </span>
              </div>
            )}
          </div>

          {/* Step 2: Finder Information */}
          {hasLocation && (
            <div className="mb-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                <span className="w-6 h-6 bg-red-500/30 rounded-full flex items-center justify-center text-xs">2</span>
                {t('finder.your_info')}
              </h3>
              <input
                type="text"
                placeholder={t('finder.first_name')}
                value={finderName}
                onChange={(e) => setFinderName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/60 mb-3 focus:outline-none focus:border-[#b8860b]"
                required
              />
              <input
                type="tel"
                placeholder={`${t('finder.whatsapp')} (${t('finder.whatsapp_placeholder')})`}
                value={finderPhone}
                onChange={(e) => setFinderPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:border-[#b8860b]"
                required
              />
            </div>
          )}

          {/* Priority Alert */}
          <div className="mb-4 p-3 bg-[#b8860b]/20 border border-[#b8860b]/40 rounded-lg">
            <p className="text-[#b8860b] text-sm font-medium text-center">
              🚨 {t('finder.priority_alert') || 'Une alerte prioritaire sera envoyée à l\'agence.'}
            </p>
          </div>

          {/* Main Action Button - Gold */}
          <button
            onClick={hasLocation && isFormComplete ? handleMainAction : handleShareLocation}
            disabled={(hasLocation && !isFormComplete) || isLoadingLocation}
            className={`w-full py-4 font-bold rounded-lg shadow-lg transition-colors flex items-center justify-center gap-2 ${
              isSubmitting 
                ? 'bg-[#b8860b]/70 text-white/80 cursor-wait' 
                : hasLocation && isFormComplete
                  ? 'bg-[#b8860b] text-white hover:bg-[#d4af37]'
                  : hasLocation
                    ? 'bg-[#b8860b]/50 text-white/70 cursor-not-allowed'
                    : 'bg-white text-[#7a1e1e] hover:bg-white/90'
            }`}
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin">⏳</span>
                {t('finder.sending')}
              </>
            ) : hasLocation && isFormComplete ? (
              <>
                <Send className="w-5 h-5" />
                {t('finder.found_this_baggage') || "J'ai trouvé ce bagage"}
              </>
            ) : hasLocation ? (
              <>
                <Send className="w-5 h-5" />
                {t('finder.send_to_owner')}
              </>
            ) : (
              <>
                <Navigation className="w-5 h-5" />
                {t('finder.share_gps')}
              </>
            )}
          </button>

          {/* Footer */}
          <div className="mt-6 text-center text-white/50 text-xs">
            <Shield className="w-4 h-4 inline mr-1" />
            {t('finder.privacy_notice')}
            <br />
            {t('common.powered_by')}
          </div>
        </div>
      </main>
    );
  }

  // Active baggage - show finder page
  const isVoyageur = baggage?.type === 'voyageur';

  // Determine button state
  const getButtonState = () => {
    if (isSubmitting) {
      return {
        text: t('finder.sending'),
        icon: <span className="animate-spin">⏳</span>,
        disabled: true,
        className: isVoyageur
          ? "bg-[#b8860b] text-white"
          : "bg-white text-[#0d5e34]"
      };
    }

    if (!hasLocation) {
      return {
        text: t('finder.share_gps'),
        icon: <Navigation className="w-5 h-5" />,
        disabled: false,
        className: isVoyageur
          ? "bg-white text-[#b8860b] hover:bg-white/90"
          : "bg-white text-[#0d5e34] hover:bg-white/90"
      };
    }

    if (!isFormComplete) {
      return {
        text: t('finder.send_to_owner'),
        icon: <Send className="w-5 h-5" />,
        disabled: true,
        className: isVoyageur
          ? "bg-[#b8860b]/50 text-white/70 cursor-not-allowed"
          : "bg-white/50 text-[#0d5e34]/70 cursor-not-allowed"
      };
    }

    return {
      text: t('finder.send_to_owner'),
      icon: <Send className="w-5 h-5" />,
      disabled: false,
      className: isVoyageur
        ? "bg-[#b8860b] text-white hover:bg-[#d4af37]"
        : "bg-white text-[#0d5e34] hover:bg-white/90"
    };
  };

  const buttonState = getButtonState();

  // Voyageur Design (Orange)
  if (isVoyageur) {
    return (
      <main className="min-h-screen bg-[#d35400] flex flex-col items-center justify-center p-4" dir={dir}>
        <div className="max-w-md w-full bg-[#b8860b]/10 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-[#b8860b]/30 relative">
          {/* Language Selector */}
          <div className="absolute top-4 right-4">
            <LanguageSelector lang={lang} setLang={setLang} />
          </div>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3">
              <Luggage className="h-6 w-6 text-[#b8860b]" />
            </div>
            <h1 className="text-xl font-bold text-white">{t('finder.found_baggage')}</h1>
            <p className="text-[#f5f5f5]/90 text-sm mt-1">
              {t('finder.help_owner')}
            </p>
          </div>

          {/* Baggage Info */}
          {baggage && (
            <div className="bg-white/10 rounded-lg p-3 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-medium">{baggage.travelerName}</p>
                <p className="text-white/60 text-sm">{reference}</p>
              </div>
            </div>
          )}

          {/* Step 1: Location */}
          <div className="mb-4">
            <h3 className="text-white font-medium mb-2 flex items-center gap-2">
              <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs">1</span>
              {t('finder.where_is_baggage')}
            </h3>

            {/* GPS Button - Only show if no location yet */}
            {!sharedPosition && (
              <button
                onClick={handleShareLocation}
                disabled={isLoadingLocation}
                className="w-full py-3 px-4 bg-white/20 border border-white/30 text-white rounded-lg font-medium flex items-center justify-center gap-2 mb-3 hover:bg-white/30 transition-colors disabled:opacity-50"
              >
                {isLoadingLocation ? (
                  <>
                    <span className="animate-spin">⏳</span> {t('finder.locating')}
                  </>
                ) : (
                  <>
                    <Navigation className="w-5 h-5" />
                    {t('finder.share_gps')}
                  </>
                )}
              </button>
            )}

            {/* GPS Status */}
            {sharedPosition && (
              <div className="mb-3 p-3 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-white text-sm">
                  {t('finder.position_confirmed')} {sharedPosition.lat.toFixed(4)}, {sharedPosition.lng.toFixed(4)}
                </span>
              </div>
            )}

            {/* Manual Location Input */}
            <input
              type="text"
              placeholder={sharedPosition ? t('finder.location_optional') : t('finder.location_placeholder')}
              value={otherLocation}
              onChange={(e) => {
                setOtherLocation(e.target.value);
                setShowLocationWarning(false);
              }}
              className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-[#f5f5f5]/70 focus:outline-none focus:border-[#b8860b]"
            />

            {/* Location Warning */}
            {showLocationWarning && !hasLocation && (
              <div className="mt-2 p-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-200 text-sm">
                  {t('finder.location_warning')}
                </span>
              </div>
            )}
          </div>

          {/* Step 2: Finder Information - Only show if location provided */}
          {hasLocation && (
            <div className="mb-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs">2</span>
                {t('finder.your_info')}
              </h3>
              <input
                type="text"
                placeholder={t('finder.first_name')}
                value={finderName}
                onChange={(e) => setFinderName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-[#f5f5f5]/70 mb-3 focus:outline-none focus:border-[#b8860b]"
                required
              />
              <input
                type="tel"
                placeholder={`${t('finder.whatsapp')} (${t('finder.whatsapp_placeholder')})`}
                value={finderPhone}
                onChange={(e) => setFinderPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-[#f5f5f5]/70 focus:outline-none focus:border-[#b8860b]"
                required
              />
            </div>
          )}

          {/* Main Action Button */}
          <button
            onClick={hasLocation && isFormComplete ? handleMainAction : handleShareLocation}
            disabled={buttonState.disabled || isLoadingLocation}
            className={`w-full py-4 font-bold rounded-lg shadow-lg transition-colors flex items-center justify-center gap-2 ${buttonState.className}`}
          >
            {buttonState.icon}
            {buttonState.text}
          </button>

          {/* Footer */}
          <div className="mt-6 text-center text-[#f5f5f5]/70 text-xs">
            <Shield className="w-4 h-4 inline mr-1" />
            {t('finder.privacy_notice')}
            <br />
            {t('common.powered_by')}
          </div>
        </div>
      </main>
    );
  }

  // Hajj Design (Green) - Same Sequential Flow
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0d5e34] to-[#0a4a2a] flex items-center justify-center p-4" dir={dir}>
      <div className="max-w-md w-full bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20 relative">
        {/* Language Selector */}
        <div className="absolute top-4 right-4">
          <LanguageSelector lang={lang} setLang={setLang} />
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3">
            <Plane className="h-6 w-6 text-[#0d5e34]" />
          </div>
          <h1 className="text-xl font-bold text-white">{t('finder.found_baggage')}</h1>
          <p className="text-white/80 text-sm mt-1">
            {t('finder.help_pilgrim')}
          </p>
        </div>

        {/* Baggage Info */}
        {baggage && (
          <div className="bg-white/10 rounded-lg p-3 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-medium">{baggage.travelerName}</p>
              <p className="text-white/60 text-sm">{reference}</p>
              {baggage.agency && (
                <p className="text-white/50 text-xs">{baggage.agency}</p>
              )}
            </div>
          </div>
        )}

        {/* Step 1: Location */}
        <div className="mb-4">
          <h3 className="text-white font-medium mb-2 flex items-center gap-2">
            <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs">1</span>
            {t('finder.where_is_baggage')}
          </h3>

          {/* GPS Button - Only show if no location yet */}
          {!sharedPosition && (
            <button
              onClick={handleShareLocation}
              disabled={isLoadingLocation}
              className="w-full py-3 px-4 bg-white/20 border border-white/30 text-white rounded-lg font-medium flex items-center justify-center gap-2 mb-3 hover:bg-white/30 transition-colors disabled:opacity-50"
            >
              {isLoadingLocation ? (
                <>
                  <span className="animate-spin">⏳</span> {t('finder.locating')}
                </>
              ) : (
                <>
                  <Navigation className="w-5 h-5" />
                  {t('finder.share_gps')}
                </>
              )}
            </button>
          )}

          {/* GPS Status */}
          {sharedPosition && (
            <div className="mb-3 p-3 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-white text-sm">
                {t('finder.position_confirmed')} {sharedPosition.lat.toFixed(4)}, {sharedPosition.lng.toFixed(4)}
              </span>
            </div>
          )}

          {/* Manual Location Input */}
          <input
            type="text"
            placeholder={sharedPosition ? t('finder.location_optional') : t('finder.location_placeholder_hajj')}
            value={otherLocation}
            onChange={(e) => {
              setOtherLocation(e.target.value);
              setShowLocationWarning(false);
            }}
            className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:border-white/50"
          />

          {/* Location Warning */}
          {showLocationWarning && !hasLocation && (
            <div className="mt-2 p-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-200 text-sm">
                {t('finder.location_warning')}
              </span>
            </div>
          )}
        </div>

        {/* Step 2: Finder Information - Only show if location provided */}
        {hasLocation && (
          <div className="mb-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h3 className="text-white font-medium mb-2 flex items-center gap-2">
              <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs">2</span>
              {t('finder.your_info')}
            </h3>
            <input
              type="text"
              placeholder={t('finder.first_name')}
              value={finderName}
              onChange={(e) => setFinderName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/60 mb-3 focus:outline-none focus:border-white/50"
              required
            />
            <input
              type="tel"
              placeholder={`${t('finder.whatsapp')} (${t('finder.whatsapp_placeholder')})`}
              value={finderPhone}
              onChange={(e) => setFinderPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:border-white/50"
              required
            />
          </div>
        )}

        {/* Main Action Button */}
        <button
          onClick={hasLocation && isFormComplete ? handleMainAction : handleShareLocation}
          disabled={buttonState.disabled || isLoadingLocation}
          className={`w-full py-4 font-bold rounded-lg shadow-lg transition-colors flex items-center justify-center gap-2 ${buttonState.className}`}
        >
          {buttonState.icon}
          {buttonState.text}
        </button>

        {/* Footer */}
        <div className="mt-6 text-center text-white/60 text-xs">
          <Shield className="w-4 h-4 inline mr-1" />
          {t('finder.privacy_notice')}
          <br />
          {t('common.powered_by')}
        </div>
      </div>
    </main>
  );
}
