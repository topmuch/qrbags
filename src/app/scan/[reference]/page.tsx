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
  Globe,
  Phone,
  MessageCircle,
  X
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
    phone?: string;
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
        <div className="absolute top-4 right-4">
          <LanguageSelector lang={lang} setLang={setLang} />
        </div>

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
    <main className="min-h-screen bg-[#080c1a] flex items-center justify-center">
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

// Success Toast Component
function SuccessToast({ show, message }: { show: boolean; message: string }) {
  if (!show) return null;
  
  return (
    <div className="fixed top-5 right-5 bg-[#ffd700] text-black px-6 py-4 rounded-xl shadow-lg z-50 animate-in slide-in-from-right duration-300">
      <div className="flex items-center gap-3">
        <CheckCircle className="w-5 h-5" />
        <div>
          <div className="font-bold">Wahoo ! 🎉</div>
          <div className="text-sm opacity-80">{message}</div>
        </div>
      </div>
    </div>
  );
}

// Contact Modal Component
function ContactModal({ 
  show, 
  onClose, 
  onWhatsApp, 
  onPhone,
  t 
}: { 
  show: boolean; 
  onClose: () => void; 
  onWhatsApp: () => void;
  onPhone: () => void;
  t: (key: string) => string;
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-gray-900">{t('finder.contact_owner')}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-gray-600 text-center text-sm mb-6">
          {t('finder.choose_method')}
        </p>
        
        {/* WhatsApp Button - Yellow Gold */}
        <button 
          onClick={onWhatsApp}
          className="w-full py-4 bg-[#ffd700] hover:bg-[#ffeb3b] text-black rounded-xl mb-3 flex items-center justify-center gap-3 font-semibold transition-colors border border-[#ffa500]"
        >
          <MessageCircle className="w-5 h-5" />
          {t('finder.by_whatsapp')}
        </button>
        
        {/* Phone Button - Yellow Gold */}
        <button 
          onClick={onPhone}
          className="w-full py-4 bg-[#ffd700] hover:bg-[#ffeb3b] text-black rounded-xl flex items-center justify-center gap-3 font-semibold transition-colors border border-[#ffa500]"
        >
          <Phone className="w-5 h-5" />
          {t('finder.by_phone')}
        </button>
        
        <button 
          onClick={onClose} 
          className="mt-4 text-gray-500 w-full text-center text-sm hover:text-gray-700"
        >
          {t('common.cancel')}
        </button>
      </div>
    </div>
  );
}

// Main Scan Page - New Design with Indigo Buttons
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
  
  // UI State
  const [showForm, setShowForm] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [locationText, setLocationText] = useState('');
  const [geoError, setGeoError] = useState<string | null>(null);
  const [showManualLocation, setShowManualLocation] = useState(false);

  const hasLocation = sharedPosition !== null || otherLocation.trim().length > 0;
  const isFormComplete = finderName.trim().length > 0 && finderPhone.trim().length > 0 && hasLocation;

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

  // GPS Location Handler - iOS Optimized
  const handleShareLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setGeoError(t('errors.geolocation_not_supported'));
      setShowManualLocation(true);
      return;
    }

    setIsLoadingLocation(true);
    setGeoError(null);

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          (error) => {
            console.error('Geolocation error:', error.code, error.message);
            reject(error);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000, // ⏱️ 10s critical for iOS
            maximumAge: 0
          }
        );
      });

      setSharedPosition({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      });
      setLocationText(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
      setGeoError(null);
      setShowManualLocation(false);
    } catch (error) {
      const geoErr = error as GeolocationPositionError;
      let errorMessage = '';

      if (geoErr.code === 1) {
        // PERMISSION_DENIED - User refused
        errorMessage = t('errors.location_permission_denied') || '⚠️ Accès à la localisation refusé. Activez-la dans Réglages > Safari > QRBag ou entrez le lieu manuellement.';
      } else if (geoErr.code === 2) {
        // POSITION_UNAVAILABLE
        errorMessage = t('errors.location_unavailable') || '📍 Service de localisation indisponible. Activez-le dans Réglages > Confidentialité > Services de localisation.';
      } else if (geoErr.code === 3) {
        // TIMEOUT - iOS silent blocking
        errorMessage = t('errors.location_timeout') || '⏳ Détection impossible. Veuillez entrer le lieu manuellement.';
      } else {
        errorMessage = t('errors.location_failed') || 'Impossible de détecter votre position.';
      }

      setGeoError(errorMessage);
      setShowManualLocation(true); // Show manual input fallback
    } finally {
      setIsLoadingLocation(false);
    }
  }, [t]);

  // Generate WhatsApp message
  const generateWhatsAppMessage = useCallback((finderName: string, finderPhone: string, locationText: string, mapLink: string) => {
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

  // Handle WhatsApp contact
  const handleWhatsApp = useCallback(async () => {
    setIsSubmitting(true);
    setShowContactModal(false);

    try {
      // Log the scan
      await fetch(`/api/scan/${reference}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: otherLocation.trim() || locationText || "Non précisé",
          finderName: finderName.trim(),
          finderPhone: finderPhone.trim(),
          message: '',
          latitude: sharedPosition?.lat,
          longitude: sharedPosition?.lng,
        }),
      });

      const finalLocationText = otherLocation.trim() || locationText || "Non précisé";
      const mapLink = sharedPosition
        ? `https://maps.app.goo.gl/?link=https://www.google.com/maps?q=${sharedPosition.lat},${sharedPosition.lng}`
        : "Localisation non partagée";

      const message = generateWhatsAppMessage(finderName, finderPhone, finalLocationText, mapLink);
      const ownerNumber = baggageData?.baggage?.whatsappOwner?.replace(/\D/g, '') || '33745349339';
      const url = `https://wa.me/${ownerNumber}?text=${message}`;

      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      if (isIOS) {
        window.location.href = url;
      } else {
        const newWindow = window.open(url, '_blank');
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          window.location.href = url;
        }
      }

      // Show success
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 4000);

    } catch (error) {
      console.error('Error:', error);
      alert(t('errors.error_occurred'));
    } finally {
      setIsSubmitting(false);
    }
  }, [reference, otherLocation, locationText, finderName, finderPhone, sharedPosition, baggageData, t, generateWhatsAppMessage]);

  // Handle phone call
  const handlePhoneCall = useCallback(() => {
    setShowContactModal(false);
    const phoneNumber = baggageData?.baggage?.phone || baggageData?.baggage?.whatsappOwner || '33745349339';
    window.location.href = `tel:${phoneNumber}`;
  }, [baggageData]);

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
    const expiredAt = (baggageData as any).expiredAt || '';
    const agencyName = (baggageData as any).agency || '';
    const params = new URLSearchParams({
      ref: reference,
      ...(expiredAt && { expired: expiredAt }),
      ...(agencyName && { agency: agencyName })
    });
    if (typeof window !== 'undefined') {
      window.location.href = `/expired?${params.toString()}`;
    }
    return <LoadingScreen t={t} />;
  }

  const baggage = baggageData?.baggage;

  // Lost baggage alert
  const isDeclaredLost = baggage?.declaredLostAt && !baggage?.foundAt;
  const isVoyageur = baggage?.type === 'voyageur';

  // Main render - New design with rose-violet gradient and yellow buttons
  return (
    <main 
      className="min-h-screen flex items-center justify-center p-4" 
      dir={dir}
      style={{ background: 'linear-gradient(180deg, #ff0080 0%, #4b0082 100%)' }}
    >
      {/* Language Selector */}
      <div className="absolute top-4 right-4">
        <LanguageSelector lang={lang} setLang={setLang} />
      </div>

      {/* Success Toast */}
      <SuccessToast show={showSuccess} message={t('finder.message_sent')} />

      {/* Main Card */}
      <div className="w-full max-w-sm bg-white/95 backdrop-blur-md border border-white/50 rounded-2xl overflow-hidden shadow-2xl">
        {/* Urgent Banner for Lost Baggage */}
        {isDeclaredLost && (
          <div className="bg-red-600 text-white text-center py-2 px-4">
            <p className="font-bold text-sm flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              URGENT - Bagage signalé perdu !
            </p>
          </div>
        )}

        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-[#ff0080] rounded-full flex items-center justify-center mx-auto mb-4">
              <Luggage className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              {t('finder.found_baggage')}
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              {t('finder.help_owner')}
            </p>
          </div>

          {/* Owner Info */}
          {baggage && (
            <div className="bg-gradient-to-r from-[#ff0080]/10 to-[#4b0082]/10 rounded-xl p-4 mb-6 border border-[#ff0080]/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#ff0080]/20 rounded-full flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-[#ff0080]" />
                </div>
                <div>
                  <div className="font-bold text-gray-900">{baggage.travelerName}</div>
                  <div className="text-gray-600 text-sm">{reference}</div>
                  {baggage.agency && (
                    <div className="text-gray-500 text-xs">{baggage.agency}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Share GPS Button (Yellow Gold) */}
          {!showForm && (
            <button
              onClick={() => {
                setShowForm(true);
                handleShareLocation();
              }}
              disabled={isLoadingLocation}
              className="w-full py-4 px-6 bg-[#ffd700] hover:bg-[#ffeb3b] text-black rounded-xl font-bold transition-colors flex items-center justify-center gap-3 shadow-lg border border-[#ffa500]"
            >
              {isLoadingLocation ? (
                <>
                  <span className="animate-spin">⏳</span>
                  {t('finder.locating')}
                </>
              ) : (
                <>
                  <Navigation className="w-5 h-5" />
                  📍 {t('finder.share_gps')}
                </>
              )}
            </button>
          )}

          {/* Step 2: Form (after GPS click) */}
          {showForm && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              {/* GPS Success Status */}
              {sharedPosition && !geoError && (
                <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-800 text-sm">
                    ✓ {locationText}
                  </span>
                </div>
              )}

              {/* GPS Error - iOS Friendly */}
              {geoError && (
                <div className="p-3 bg-orange-100 border border-orange-300 rounded-xl">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-orange-800 text-sm font-medium">{t('finder.gps_unavailable')}</p>
                      <p className="text-orange-700 text-xs mt-1">{geoError}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Manual Location Input - Always visible after GPS attempt */}
              <div className={sharedPosition ? 'opacity-75' : ''}>
                <label className="text-xs text-gray-500 mb-1 block">
                  {sharedPosition ? t('finder.location_optional') : t('finder.location_label')}
                </label>
                <input
                  type="text"
                  placeholder={sharedPosition ? t('finder.location_optional_placeholder') : t('finder.location_placeholder')}
                  value={otherLocation}
                  onChange={(e) => setOtherLocation(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff0080] focus:border-transparent"
                />
              </div>

              {/* Name Input */}
              <input
                type="text"
                placeholder={t('finder.first_name')}
                value={finderName}
                onChange={(e) => setFinderName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff0080] focus:border-transparent"
              />

              {/* WhatsApp Input */}
              <input
                type="tel"
                placeholder={`${t('finder.whatsapp')} (+33612345678)`}
                value={finderPhone}
                onChange={(e) => setFinderPhone(e.target.value)}
                className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff0080] focus:border-transparent"
              />

              {/* Contact Button (Yellow Gold) - Can work without GPS */}
              <button
                onClick={() => {
                  // Only require location if GPS failed and no manual input
                  if (!sharedPosition && !otherLocation.trim()) {
                    // Show inline message instead of alert
                    setGeoError(t('finder.please_enter_location') || 'Veuillez entrer le lieu où vous avez trouvé le bagage.');
                    return;
                  }
                  if (!finderName.trim() || !finderPhone.trim()) {
                    alert(t('finder.fill_info'));
                    return;
                  }
                  setShowContactModal(true);
                }}
                disabled={isSubmitting}
                className="w-full py-4 px-6 bg-[#ffd700] hover:bg-[#ffeb3b] text-black rounded-xl font-bold transition-colors flex items-center justify-center gap-3 shadow-lg disabled:opacity-70 border border-[#ffa500]"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    {t('finder.sending')}
                  </>
                ) : (
                  <>
                    <Phone className="w-5 h-5" />
                    📞 {t('finder.contact_owner')}
                  </>
                )}
              </button>

              {/* Retry GPS Button */}
              {geoError && !sharedPosition && (
                <button
                  onClick={handleShareLocation}
                  disabled={isLoadingLocation}
                  className="w-full py-2 text-sm text-gray-600 hover:text-gray-800 flex items-center justify-center gap-2"
                >
                  <Navigation className="w-4 h-4" />
                  {isLoadingLocation ? t('finder.locating') : t('finder.retry_gps')}
                </button>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-gray-500">
            <Shield className="w-4 h-4 inline mr-1" />
            {t('finder.privacy_notice')}
            <br />
            QRBag © 2026 by MMASOLUTION
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      <ContactModal
        show={showContactModal}
        onClose={() => setShowContactModal(false)}
        onWhatsApp={handleWhatsApp}
        onPhone={handlePhoneCall}
        t={t}
      />
    </main>
  );
}
