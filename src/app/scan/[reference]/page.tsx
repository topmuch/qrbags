'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BrandCard,
  BrandIconRing,
  brandInput,
  brandBtnGradient,
  brandBtnNavy,
  brandBadge,
} from '@/components/brand/BrandShell';
import {
  Luggage,
  AlertCircle,
  Clock,
  Shield,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Globe,
  Phone,
  MessageCircle,
  Gift,
  BadgeCheck,
  Lock,
  Volume2,
} from "lucide-react";
import { useTranslation } from '@/hooks/useTranslation';
import { Language, LANGUAGE_NAMES } from '@/lib/i18n';
import dynamic from 'next/dynamic';
import SuccessOverlay from '@/components/ui/SuccessOverlay';
import PhoneInput from '@/components/ui/PhoneInput';
import { toast } from '@/hooks/use-toast';

// CHAT-FEATURE: Lazy-load du chat anonyme trouveur ↔ propriétaire (polling 5 s)
const FinderChat = dynamic(() => import('@/components/finder/FinderChat'), {
  ssr: false,
  loading: () => null,
});

// TRANSPORT-FEATURE: Multi-transport support (real images, emojis as fallback)
// (conservé pour le bloc "Détails du voyage" du suivi — le sélecteur de mode
// a été retiré de l'écran d'activation : le mode par défaut est appliqué par l'API)
import {
  safeTransportMode,
  getTransportImage,
  getTransportBlockHeader,
  getTransportIcon,
} from '@/lib/transport';
import type { TransportMode } from '@/lib/transport';

// AI-FEATURE: Lazy-load ChatbotWidget (Feature #1) — doesn't block page render
const ChatbotWidget = dynamic(() => import('@/components/finder/ChatbotWidget'), {
  ssr: false,
  loading: () => null,
});

// Design system QRBags « étiquette 7×10 » appliqué via BrandShell/BrandCard
// (palette navy #16234e / azure #2f9bff / orange #f8921f / rouge #ef4036 /
//  magenta #e6216e / violet #8b17c9 — voir src/components/brand/BrandShell.tsx)
const FALLBACK_PHONE = '33745349339';

interface BaggageData {
  status: string;
  message?: string;
  theme?: string;
  type?: string;
  expiredAt?: string;
  agency?: string;
  /** 🔔 Langue auto : détectée côté serveur via Accept-Language (premier scan) */
  detectedLang?: 'fr' | 'en' | 'ar';
  baggage?: {
    reference: string;
    type: string;
    travelerName: string;
    baggageIndex: number;
    baggageType: string;
    status: string;
    hasPhoto?: boolean;
    reward?: string | null;
    airlineName?: string;
    flightNumber?: string;
    destination?: string;
    agency?: string;
    whatsappOwner?: string;
    declaredLostAt?: string | null;
    foundAt?: string | null;
    createdAt?: string | null;
    departureDate?: string | null;
    departureTime?: string | null;
    // TRANSPORT-FEATURE: Transport mode + conditional fields
    transportMode?: string;
    trainCompany?: string | null;
    trainNumber?: string | null;
    shipName?: string | null;
    shipCabin?: string | null;
    busCompany?: string | null;
    busLineNumber?: string | null;
  };
}

// ─── Language Selector Component (carte blanche — design system QRBags) ───
function LanguageSelector({ lang, setLang }: { lang: Language; setLang: (l: Language) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 bg-white border-2 border-[#16234e]/15 rounded-full text-[#16234e] hover:border-[#2f9bff] hover:text-[#2f9bff] transition-colors text-xs sm:text-sm md:text-base font-medium shadow-sm min-h-[44px]"
      >
        <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
        <span>{LANGUAGE_NAMES[lang]}</span>
      </button>

      {isOpen && (
        <div role="listbox" aria-label="Language" className="absolute top-full right-0 mt-1 sm:mt-2 bg-white border border-[#16234e]/10 rounded-xl shadow-xl overflow-hidden z-50 min-w-[140px] sm:min-w-[160px]">
          {(['fr', 'en', 'ar'] as Language[]).map((l) => (
            <button
              key={l}
              role="option"
              aria-selected={lang === l}
              onClick={() => {
                setLang(l);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2.5 sm:px-5 sm:py-3 text-left text-xs sm:text-sm md:text-base font-medium transition-colors ${
                lang === l
                  ? 'bg-[#2f9bff]/10 text-[#16234e] font-bold'
                  : 'text-[#16234e] hover:bg-[#16234e]/5'
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

// ─── Activation Redirect Component (design system QRBags) ───
// ACTIVATION-FLOW: redirection directe vers /inscrire?qr=REF — le sélecteur de
// mode de transport (avion/train/bus/bateau) a été supprimé ; l'API applique
// son mode par défaut ('flight') à l'activation.
function ActivationRedirect({ type, reference, t, lang, setLang }: {
  type: string;
  reference: string;
  t: (key: string, params?: Record<string, string>) => string;
  lang: Language;
  setLang: (l: Language) => void;
}) {
  const router = useRouter();

  const isHajj = type === 'hajj';

  const handleContinue = () => {
    const url = isHajj
      ? `/hajj/activate?qr=${reference}`
      : `/inscrire?qr=${reference}`;
    router.push(url);
  };

  return (
    <FinderShell>
      <main className="min-h-screen flex items-center justify-center p-5 md:p-8">
        <div className="max-w-md w-full">
          <div className="flex justify-end mb-3">
            <LanguageSelector lang={lang} setLang={setLang} />
          </div>

          <BrandCard corners className="p-6 md:p-8 text-center">
            <div className="relative inline-block mb-5">
              <BrandIconRing size="w-16 h-16" glow="#2f9bff">
                <img src="/logo.png" alt="Logo QRBags" className="w-11 h-11 object-contain rounded-2xl" aria-hidden />
              </BrandIconRing>
              <div className="absolute -top-1 -right-1 w-7 h-7 bg-gradient-qrbag rounded-full flex items-center justify-center shadow-md shadow-[#e6216e]/30">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-[#16234e] mb-1">
              {t('common.welcome')}
            </h1>
            <p className="text-[#16234e]/70 text-sm md:text-base mb-5">
              {t('inscrire.subtitle')}
            </p>

            {isHajj && (
              <>
                <div className="bg-[#2f9bff]/5 border border-[#16234e]/10 rounded-xl p-4 mb-5">
                  <p className="text-[#16234e]/60 text-sm mb-2">{t('common.baggage_type')}</p>
                  <span className={`${brandBadge} text-sm md:text-base px-5 py-2`}>
                    {t('common.hajj_label')}
                  </span>
                </div>
                <button
                  className={`${brandBtnGradient} w-full py-4 px-6 flex items-center justify-center gap-2 text-lg min-h-[56px] cursor-pointer`}
                  onClick={handleContinue}
                >
                  {t('common.start_activation')}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </>
            )}

            {!isHajj && (
              <>
                <div className="bg-[#2f9bff]/5 border border-[#16234e]/10 rounded-xl p-4 mb-5">
                  <p className="text-[#16234e]/60 text-sm mb-2">{t('common.baggage_type')}</p>
                  <span className={`${brandBadge} text-sm md:text-base px-5 py-2`}>
                    {t('common.voyageur_label')}
                  </span>
                </div>

                <button
                  className={`${brandBtnGradient} w-full py-4 px-6 flex items-center justify-center gap-2 text-lg min-h-[56px] cursor-pointer`}
                  onClick={handleContinue}
                >
                  {t('common.start_activation')}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </>
            )}
          </BrandCard>
        </div>
      </main>
    </FinderShell>
  );
}

// ─── Loading Component (design system QRBags — fond blanc) ───
function LoadingScreen({ t }: { t: (key: string) => string }) {
  return (
    <FinderShell>
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-[#16234e]/15 border-t-[#e6216e] rounded-full mx-auto mb-4"></div>
          <p className="text-lg font-medium text-[#16234e]">{t('common.loading')}</p>
        </div>
      </main>
    </FinderShell>
  );
}

// ─── Error Screen (design system QRBags — BrandCard corners + BrandIconRing) ───
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
      icon: <AlertCircle className="w-10 h-10 text-[#e6216e]" />,
      glow: '#e6216e',
      title: t('errors.qr_not_valid'),
      message: t('errors.qr_not_valid_desc')
    },
    blocked: {
      icon: <Shield className="w-10 h-10 text-[#8b17c9]" />,
      glow: '#8b17c9',
      title: t('errors.baggage_blocked'),
      message: t('errors.baggage_blocked_desc')
    },
    expired: {
      icon: <Clock className="w-10 h-10 text-[#f8921f]" />,
      glow: '#f8921f',
      title: t('errors.protection_expired'),
      message: t('errors.protection_expired_desc')
    }
  };

  const config = errorConfig[type as keyof typeof errorConfig] || errorConfig.not_found;

  return (
    <FinderShell>
      <main className="min-h-screen flex items-center justify-center p-5 md:p-8">
        <div className="max-w-md w-full">
          <div className="flex justify-end mb-3">
            <LanguageSelector lang={lang} setLang={setLang} />
          </div>

          <BrandCard corners className="p-6 md:p-8 text-center">
            <div className="flex justify-center mb-5">
              <BrandIconRing size="w-20 h-20" glow={config.glow}>
                {config.icon}
              </BrandIconRing>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#16234e] mb-3">{config.title}</h1>
            <p className="text-[#16234e]/70 text-base md:text-lg mb-6">{config.message}</p>
            <button
              className={`${brandBtnNavy} w-full py-4 px-6 flex items-center justify-center gap-2 text-base min-h-[52px] cursor-pointer`}
              onClick={() => router.push('/')}
            >
              {t('common.back_home')}
            </button>
          </BrandCard>
        </div>
      </main>
    </FinderShell>
  );
}

// ─── Soft Encart Helper (fond azure doux + bordure navy discrète — design system QRBags) ───
function SoftEncart({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#2f9bff]/5 border border-[#16234e]/10 rounded-xl p-3 mb-2.5 last:mb-0 ${className}`}>
      {children}
    </div>
  );
}

// ─── FinderShell — coquille sobre pour la page trouveur ───
// REFONTE-9 : toutes les décorations de fond (carte pointillée, halos de
// couleur, arcs arc-en-ciel, liseré dégradé) sont retirées — fond blanc net.
function FinderShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-white overflow-x-clip">
      <div className="relative z-10 flex flex-col min-h-screen">{children}</div>
    </div>
  );
}

// ─── NavyEncart — encart à bandeau bleu de nuit (refonte-9) ───
// Chaque bloc clé (Propriétaire / Photo de la valise / Détail du vol /
// Détails contact) est entouré d'un cadre navy + d'un bandeau titre bleu
// de nuit (#16234e) : lisibilité maximale, zéro décoration superflue.
function NavyEncart({
  title,
  icon,
  children,
  className = '',
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`w-full mb-4 rounded-2xl overflow-hidden border-2 border-[#16234e] shadow-lg shadow-[#16234e]/10 ${className}`}
    >
      {/* Bandeau bleu de nuit — titre de l'encart */}
      <div className="bg-[#16234e] px-5 py-3.5 flex items-center gap-2.5 text-white">
        {icon}
        <h2 className="text-xs md:text-sm uppercase tracking-widest font-bold">{title}</h2>
      </div>
      {/* Corps blanc — contenu de l'encart */}
      <div className="bg-white p-5 md:p-6">{children}</div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// ─── MAIN SCAN PAGE ───
// ═══════════════════════════════════════════════════════════════
export default function ScanPage() {
  const params = useParams();
  const reference = params.reference as string;

  const { t, lang, setLang, applyAutoDetectedLang, dir, countryCode } = useTranslation();

  const [baggageData, setBaggageData] = useState<BaggageData | null>(null);
  const [loading, setLoading] = useState(true);

  // UI State
  const [showForm, setShowForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Finder form state
  const [finderName, setFinderName] = useState('');
  const [finderPhone, setFinderPhone] = useState('');
  const [finderPhoneCountry, setFinderPhoneCountry] = useState(countryCode);
  const [otherLocation, setOtherLocation] = useState('');
  // GPS is now captured INLINE inside handleWhatsApp (no separate button/state).
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // CHAT-FEATURE: panneau du chat anonyme (ouvert via le bouton CHAT)
  const [chatOpen, setChatOpen] = useState(false);

  // 🔔 Indicatif préselectionné : resynchronisé quand la détection pays (IP /
  // locales / fuseau) résout APRÈS le montage — `countryCode` vaut 'FR' au
  // premier render. Garde-fous : l'utilisateur n'a ni saisi de numéro, ni
  // choisi manuellement un autre pays (sinon on n'écrase pas son choix).
  useEffect(() => {
    if (countryCode && countryCode !== 'FR' && !finderPhone) {
      setFinderPhoneCountry(prev => (prev === 'FR' ? countryCode : prev));
    }
  }, [countryCode, finderPhone]);


  // SuccessOverlay state
  const [scanConfirmed, setScanConfirmed] = useState(false);
  const hasConfirmedRef = useRef(false);

  // ─── AUDIO-GUIDE (Option B) ───
  // Overlay d'accueil « Appuyez pour contacter » : le premier tap débloque
  // l'audio du navigateur (autoplay policy : Safari/Chrome bloquent tout son
  // sans interaction) puis lance le guide vocal TTS pré-généré dans la langue
  // du trouveur. Un bouton flottant permet de réécouter ensuite.
  const [showWelcome, setShowWelcome] = useState(true);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playGuideAudio = useCallback(() => {
    try {
      // Stoppe toute lecture précédente (bouton « réécouter »)
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      const audio = new Audio(`/audio/scan-guide-${lang}.mp3`);
      audioRef.current = audio;
      audio.onplay = () => setIsAudioPlaying(true);
      audio.onended = () => setIsAudioPlaying(false);
      audio.onpause = () => setIsAudioPlaying(false);
      // Fichier manquant / refus navigateur → silencieux, la page reste fonctionnelle
      audio.onerror = () => setIsAudioPlaying(false);
      void audio.play().catch(() => setIsAudioPlaying(false));
    } catch {
      setIsAudioPlaying(false);
    }
  }, [lang]);

  const handleWelcomeStart = useCallback(() => {
    setShowWelcome(false);
    playGuideAudio();
  }, [playGuideAudio]);

  useEffect(() => {
    const fetchBaggage = async () => {
      try {
        // cache:'no-store' — garantit qu'un QR rescanné après activation
        // ne reçoive jamais une réponse « pending_activation » en cache HTTP.
        const response = await fetch(`/api/scan/${reference}`, { cache: 'no-store' });
        const data = await response.json();
        setBaggageData(data);

        // 🔔 LANGUE AUTO : applique la langue détectée serveur (Accept-Language du
        // navigateur du trouveur) dès la première visite — sans écraser une
        // préférence explicite (localStorage) déjà choisie par l'utilisateur.
        if (data?.detectedLang) {
          applyAutoDetectedLang(data.detectedLang as Language);
        }
      } catch (error) {
        console.error('Error fetching baggage:', error);
        setBaggageData({ status: 'error', message: 'Erreur serveur' });
      } finally {
        setLoading(false);
      }
    };

    fetchBaggage();
  }, [reference, applyAutoDetectedLang]);

  // Trigger SuccessOverlay once when baggage loads successfully
  useEffect(() => {
    if (baggageData?.baggage?.reference && !hasConfirmedRef.current) {
      hasConfirmedRef.current = true;
      setScanConfirmed(true);
    }
  }, [baggageData?.baggage?.reference]);

  // NOTE: GPS sharing now happens inline inside handleWhatsApp (silent fallback to manual location).
  // The dedicated "Partager ma position GPS" button was removed per refonte-6 brief.

  // Generate WhatsApp message — new template (refonte-7): friendly notification to the owner
  const generateWhatsAppMessage = useCallback((
    finderName: string,
    finderPhone: string,
    locationText: string,
    mapLink: string,
    travelerName: string,
    baggageType: string
  ) => {
    const trackingUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://qrbags.com'}/suivi/${reference}`;

    // Extract owner's first name from full name
    const firstName = travelerName.split(' ')[0] || travelerName || '';

    // Baggage type label (voyageur/hajj) — i18n-aware
    const typeLabel = baggageType === 'hajj'
      ? t('common.hajj_label')
      : t('common.voyageur_label');

    // [Lieu] = where the bag was found (manual text, GPS coords, or fallback label)
    const location = locationText || t('whatsapp.gps_shared_label');

    // [Adresse] = current precise address (Google Maps link if GPS, else same as location, else fallback)
    const address = mapLink.startsWith('http')
      ? mapLink
      : (locationText || t('whatsapp.location_not_shared'));

    // Build message using the template (refonte-7)
    // ⚠️ wa.me corrompt les emojis (UTF-8 4 octets → U+FFFD dans le chemin 302
    // api.whatsapp.com — vérifié par test réseau). On les retire avant encodage :
    // les accents et le texte passent, eux, sans altération. Le message garde
    // sa structure (sauts de ligne) donc reste clair dans WhatsApp.
    return encodeURIComponent(
      t('whatsapp.found_message', {
        firstName,
        type: typeLabel,
        location,
        address,
        name: finderName,
        phone: finderPhone,
        url: trackingUrl,
      })
        .replace(/[\u{10000}-\u{10FFFF}\u{FE0F}\u{2600}-\u{27BF}]/gu, '')
        .replace(/[ \t]{2,}/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
    );
  }, [reference, t]);

  // Log scan to API (shared by WhatsApp + Phone flows).
  // sharedPos/locText are passed as params (no longer state) — GPS is captured inline in handleWhatsApp.
  const logScan = useCallback(async (
    sharedPos?: { lat: number; lng: number } | null,
    locText?: string
  ) => {
    try {
      await fetch(`/api/scan/${reference}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: otherLocation.trim() || locText || t('finder.not_specified'),
          finderName: finderName.trim(),
          finderPhone: finderPhone.trim(),
          message: '',
          latitude: sharedPos?.lat,
          longitude: sharedPos?.lng,
        }),
      });
    } catch (e) {
      // Continue with contact even if logging fails
      console.error('Log scan failed:', e);
    }
  }, [reference, otherLocation, finderName, finderPhone, t]);

  // Handle WhatsApp contact — GPS is captured INLINE with silent fallback to manual location.
  // Flow: validate name+phone → try GPS (10s timeout, silent fail) → log scan → open wa.me
  const handleWhatsApp = useCallback(async () => {
    // Inline validation (name + phone required; location optional since GPS is auto)
    if (!finderName.trim() || !finderPhone.trim()) {
      toast({ title: t('finder.fill_info'), variant: 'destructive' });
      return;
    }

    // Step 1: try to get GPS automatically (silent fallback if it fails)
    setIsLocating(true);
    let sharedPos: { lat: number; lng: number } | null = null;
    let locText = '';

    if (navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });
        });
        sharedPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        locText = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
      } catch {
        // Silent fallback — use manual location or "not specified"
        toast({ title: t('finder.gps_fallback_toast') });
      }
    }

    setIsLocating(false);
    setIsSubmitting(true);

    try {
      await logScan(sharedPos, locText);

      const finalLocationText = locText || otherLocation.trim() || t('finder.not_specified');
      const mapLink = sharedPos
        ? `https://maps.app.goo.gl/?link=https://www.google.com/maps?q=${sharedPos.lat},${sharedPos.lng}`
        : t('whatsapp.location_not_shared');

      const message = generateWhatsAppMessage(
        finderName,
        finderPhone,
        finalLocationText,
        mapLink,
        baggageData?.baggage?.travelerName || '',
        baggageData?.baggage?.type || 'voyageur'
      );

      // ─── Normalisation robuste du numéro propriétaire ───
      // Certains anciens enregistrements contiennent « +221 … », « 00221… » ou
      // des espaces. Un numéro mal formé est LA cause n°1 de la page
      // « Télécharger l'application » de WhatsApp (numéro introuvable).
      const rawOwner = baggageData?.baggage?.whatsappOwner || '';
      let ownerNumber = rawOwner.replace(/\D/g, '');
      if (ownerNumber.startsWith('00')) ownerNumber = ownerNumber.slice(2); // préfixe international 00
      if (!/^[1-9]\d{7,14}$/.test(ownerNumber)) {
        // Numéro absent ou invalide (local sans indicatif, commence par 0, etc.)
        // → fallback support QRBags + info console pour diagnostic prod.
        console.warn(`[SCAN ${reference}] Numéro propriétaire invalide pour WhatsApp: "${rawOwner}" → fallback support`);
        ownerNumber = FALLBACK_PHONE;
      }

      // Lien canonique WhatsApp : format officiel wa.me (universal link le plus
      // fiable vers l'app — doc développeurs WhatsApp). Le texte est déjà passé
      // dans encodeURIComponent (emojis 4 octets sûrs).
      const url = `https://wa.me/${ownerNumber}?text=${message}`;

      // ─── Navigation : même onglet sur mobile, nouvel onglet sur desktop ───
      // Sur mobile, window.open(..., '_blank') ouvre un onglet en arrière-plan où
      // Chrome peut bloquer la redirection intent:// → l'utilisateur atterrit sur
      // la page « Télécharger l'application » au lieu du chat. La navigation dans
      // le même onglet déclenche le lien universel → ouverture directe de l'app.
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      if (isMobile) {
        window.location.href = url;
        // Si l'app ne s'est pas ouverte (WhatsApp absent, lien intercepté par un
        // navigateur in-app…), le trouveur est toujours sur la page après ~2,5 s
        // → conseil utile au lieu d'une page « Télécharger WhatsApp » muette.
        window.setTimeout(() => {
          if (!document.hidden) {
            toast({ title: t('finder.whatsapp_hint_title'), description: t('finder.whatsapp_hint_desc') });
          }
        }, 2500);
      } else {
        const newWindow = window.open(url, '_blank');
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          window.location.href = url;
        }
      }

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 4000);
      toast({ title: t('finder.success_title'), description: t('finder.message_sent') });
    } catch (error) {
      console.error('Error:', error);
      toast({ title: t('errors.error_occurred'), variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }, [finderName, finderPhone, t, logScan, otherLocation, baggageData, generateWhatsAppMessage]);

  // Handle phone call — opens tel:${phone}. No GPS (no message to embed it in).
  const handlePhoneCall = useCallback(async () => {
    // Inline validation (same as WhatsApp: name + phone required)
    if (!finderName.trim() || !finderPhone.trim()) {
      toast({ title: t('finder.fill_info'), variant: 'destructive' });
      return;
    }

    await logScan(null, '');

    // ─── Normalisation du numéro pour tel: ───
    // Un tel: avec espaces/tirets est toléré par iOS mais casse sur certains
    // Android → format international compact « +XXYYYYYYYY » uniquement.
    const rawOwner = baggageData?.baggage?.whatsappOwner || '';
    let telNumber = rawOwner.replace(/[^+0-9]/g, '');
    if (telNumber.startsWith('00')) telNumber = `+${telNumber.slice(2)}`;
    if (!/^\+?[1-9]\d{7,14}$/.test(telNumber.replace(/\+/g, ''))) {
      telNumber = `+${FALLBACK_PHONE}`;
    }
    if (!telNumber.startsWith('+')) telNumber = `+${telNumber}`;

    window.location.href = `tel:${telNumber}`;
  }, [finderName, finderPhone, t, logScan, baggageData]);

  // Format date for display
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    const locale = lang === 'ar' ? 'ar-SA' : lang === 'en' ? 'en-US' : 'fr-FR';
    return new Date(dateStr).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // NOTE: validateFinderForm was removed — validation is now inlined in handleWhatsApp/handlePhoneCall.
  // Location is no longer required (GPS is auto-captured inside handleWhatsApp).

  // ─── Loading state ───
  if (loading) {
    return <LoadingScreen t={t} />;
  }

  // ─── Redirect to activation if pending ───
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

  // ─── Error states ───
  if (baggageData?.status === 'not_found') {
    return <ErrorScreen type="not_found" t={t} lang={lang} setLang={setLang} />;
  }

  if (baggageData?.status === 'blocked') {
    return <ErrorScreen type="blocked" t={t} lang={lang} setLang={setLang} />;
  }

  if (baggageData?.status === 'expired') {
    const expiredAt = baggageData.expiredAt || '';
    const agencyName = baggageData.agency || '';
    const urlParams = new URLSearchParams({
      ref: reference,
      ...(expiredAt && { expired: expiredAt }),
      ...(agencyName && { agency: agencyName })
    });
    if (typeof window !== 'undefined') {
      window.location.href = `/expired?${urlParams.toString()}`;
    }
    return <LoadingScreen t={t} />;
  }

  const baggage = baggageData?.baggage;
  const isDeclaredLost = baggage?.declaredLostAt && !baggage?.foundAt;

  // ═══════════════════════════════════════════════════════════════
  // ─── MAIN RENDER — BrandShell blanc + BrandCard + encarts doux (design system QRBags) ───
  // ═══════════════════════════════════════════════════════════════
  return (
    <FinderShell>
    <main
      className="flex-1 flex flex-col px-4 sm:px-5 md:px-8 pb-[env(safe-area-inset-bottom,0px)]"
      dir={dir}
    >
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-40 flex items-center justify-end pt-[env(safe-area-inset-top,0px)] px-0 py-2 sm:py-3 md:py-4 bg-white/85 backdrop-blur-sm rounded-b-2xl">
        <LanguageSelector lang={lang} setLang={setLang} />
      </header>

      {/* SuccessOverlay — Premium scan confirmation */}
      <SuccessOverlay show={scanConfirmed} messageKey="scan.success" t={t} />

      {/* ═══ AUDIO-GUIDE (Option B) — Overlay d'accueil « Appuyez pour contacter » ═══
          Premier tap = interaction utilisateur → débloque l'audio (autoplay policy)
          → lance le guide vocal TTS pré-généré (/audio/scan-guide-{lang}.mp3) */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[#16234e]/70 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            aria-label={t('scan.welcome_title')}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="w-full max-w-sm"
            >
              {/* REFONTE-9 : overlay sobre — bandeau bleu de nuit + carte blanche,
                  sans dégradés ni décorations. La fonction audio est conservée. */}
              <BrandCard className="w-full overflow-hidden">
                {/* Bandeau bleu de nuit — titre */}
                <div className="bg-[#16234e] px-5 pt-6 pb-5 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white flex items-center justify-center shadow-md overflow-hidden">
                    <img src="/logo.png" alt="Logo QRBags" className="w-12 h-12 object-contain rounded-2xl" aria-hidden />
                  </div>

                  <h2 className="text-2xl font-black text-white leading-tight tracking-tight">
                    {t('scan.welcome_title')}
                  </h2>
                  <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-xs mx-auto font-medium">
                    {t('scan.welcome_subtitle')}
                  </p>
                  <p className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/30 text-white font-mono font-bold text-xs tracking-widest">
                    <Luggage className="w-3.5 h-3.5" aria-hidden />
                    {reference}
                  </p>
                </div>

                {/* CTA — le tap débloque l'audio et ferme l'overlay */}
                <div className="bg-white px-4 py-5">
                  <button
                    type="button"
                    onClick={handleWelcomeStart}
                    className={`${brandBtnNavy} relative w-full py-4 text-base sm:text-lg flex items-center justify-center gap-2.5 min-h-[56px]`}
                  >
                    <Volume2 className="w-6 h-6" aria-hidden />
                    {t('scan.welcome_cta')}
                  </button>
                  <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#16234e]/50 text-center flex items-center justify-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5" aria-hidden />
                    {t('scan.welcome_audio_hint')}
                  </p>
                </div>
              </BrandCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bouton flottant « réécouter » — visible après fermeture de l'overlay */}
      {!showWelcome && (
        <button
          type="button"
          onClick={playGuideAudio}
          aria-label={t('scan.replay_audio')}
          title={t('scan.replay_audio')}
          className={`fixed bottom-4 left-4 z-40 w-12 h-12 rounded-full bg-[#16234e] text-white shadow-lg flex items-center justify-center hover:bg-[#1c2d63] transition-colors ${isAudioPlaying ? 'ring-2 ring-[#ffd200] ring-offset-2' : ''}`}
        >
          <Volume2 className={`w-5 h-5 ${isAudioPlaying ? 'animate-pulse' : ''}`} aria-hidden />
        </button>
      )}

      {/* Success Toast — inline confirmation */}
      {showSuccess && (
        <div className="fixed top-[calc(3.5rem+env(safe-area-inset-top,0px))] sm:top-[calc(4rem+env(safe-area-inset-top,0px))] right-3 sm:right-5 bg-[#16234e] text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl shadow-lg z-50 animate-in slide-in-from-right duration-300 max-w-[calc(100vw-2rem)] sm:max-w-sm">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-[#ffd200]" />
            <div>
              <div className="font-bold text-lg">{t('finder.success_title')} 🎉</div>
              <div className="text-base opacity-90">{t('finder.message_sent')}</div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Container ─── */}
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col py-4 sm:py-6 md:py-2">

        {/* ═══ HERO — sobre (refonte-9 : dégradés, emojis et animations retirés) ═══ */}
        <div className="mb-5 sm:mb-6">
          <BrandCard className="w-full overflow-hidden">
            {/* Bandeau bleu de nuit — titre principal */}
            <div className="bg-[#16234e] px-5 pt-6 pb-5 text-center">
              {isDeclaredLost && (
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-white flex items-center justify-center shadow-md">
                  <Shield className="w-7 h-7 text-[#8b17c9]" aria-hidden />
                </div>
              )}
              <h1 className="text-2xl md:text-3xl font-black text-white leading-tight tracking-tight">
                {isDeclaredLost ? t('finder.hero_lost_title') : t('finder.hero_bravo_title')}
              </h1>
              <p className="mt-2 text-sm md:text-base text-white/80 leading-relaxed max-w-md mx-auto font-medium">
                {isDeclaredLost ? t('finder.hero_lost_subtitle') : t('finder.hero_bravo_subtitle')}
              </p>
              <p className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/30 text-white font-mono font-bold text-xs tracking-widest">
                <Luggage className="w-3.5 h-3.5" aria-hidden />
                {reference}
              </p>
            </div>
          </BrandCard>
        </div>

        {/* ═══ RÉCOMPENSE — encart sobre (refonte-9 : halo dégradé, étincelles et animations retirés) ═══ */}
        {baggage?.reward && (
          <section
            role="status"
            aria-label={t('finder.reward_spotlight_title')}
            className="w-full mb-4 rounded-2xl overflow-hidden border-2 border-[#16234e] shadow-lg shadow-[#16234e]/10"
          >
            {/* Bandeau bleu de nuit — titre */}
            <div className="bg-[#16234e] px-5 py-3.5 flex items-center gap-2.5 text-white">
              <Gift className="w-4 h-4" aria-hidden />
              <h2 className="text-xs md:text-sm uppercase tracking-widest font-bold">
                {t('finder.reward_spotlight_title')}
              </h2>
            </div>
            {/* Corps blanc — contenu */}
            <div className="bg-white px-5 py-5 text-center">
              <p className="text-2xl md:text-3xl font-black text-[#16234e] leading-tight break-words">
                {baggage.reward}
              </p>
              <p className="mt-2 text-xs md:text-sm text-[#16234e]/60 font-medium leading-relaxed max-w-xs mx-auto">
                {t('finder.reward_spotlight_guarantee')}
              </p>
              <p className="mt-2.5 inline-flex items-center gap-1.5 text-[#16234e] text-xs font-bold">
                <BadgeCheck className="w-4 h-4" aria-hidden />
                {t('finder.reward_spotlight_badge')}
              </p>
            </div>
          </section>
        )}

        {/* ═══ BLOC 1 : IDENTITÉ PROPRIÉTAIRE — encart bandeau bleu de nuit (refonte-9) ═══ */}
        {baggage && (
          <NavyEncart
            title={t('finder.owner_section')}
            icon={<span className="text-base" aria-hidden>👤</span>}
          >
            {/* Full Name — kept */}
            <SoftEncart>
              <div className="flex items-center gap-3">
                <span className="text-xl">👤</span>
                <div>
                  <p className="text-xs text-[#16234e]/60 font-medium">{t('finder.fullName')}</p>
                  <p className="text-base md:text-lg font-bold text-[#16234e]">{baggage.travelerName || t('finder.notSet')}</p>
                </div>
              </div>
            </SoftEncart>

            {/* NOTE: Agency + Baggage Type REMOVED per refonte-4 brief */}

            {/* Contact — Secured (NEVER show WhatsApp number) */}
            <SoftEncart className="mb-0">
              <div className="flex items-center gap-3">
                <span className="text-xl">🔒</span>
                <div>
                  <p className="text-xs text-[#16234e]/60 font-medium">{t('finder.contact_label')}</p>
                  <p className="text-base font-bold text-[#16234e]">{t('finder.secure_contact')}</p>
                  <p className="text-xs text-[#16234e]/60 mt-0.5">{t('finder.contact_reveal_note')}</p>
                </div>
              </div>
            </SoftEncart>
          </NavyEncart>
        )}

        {/* ═══ PHOTO DE LA VALISE — encart bandeau bleu de nuit (refonte-9) ═══ */}
        {baggage?.hasPhoto && (
          <NavyEncart
            title={t('finder.baggage_photo')}
            icon={<span className="text-base" aria-hidden>📸</span>}
          >
            <a
              href={`/api/baggage-photo/${baggage.reference}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block w-full aspect-[4/3] overflow-hidden rounded-xl border border-[#16234e]/10 bg-[#2f9bff]/5"
              title={t('finder.baggage_photo_open')}
              aria-label={`${t('finder.baggage_photo')} — ${t('finder.baggage_photo_open')}`}
            >
              <Image
                src={`/api/baggage-photo/${baggage.reference}`}
                alt={t('finder.baggage_photo')}
                fill
                sizes="(max-width: 768px) 100vw, 448px"
                className="object-contain transition-transform duration-300 group-hover:scale-[1.03]"
                unoptimized
              />
              <span className="absolute bottom-2 right-2 bg-[#16234e]/80 text-white text-[10px] md:text-xs px-2.5 py-1 rounded-full opacity-90 group-hover:opacity-100 transition-opacity">
                🔍 {t('finder.baggage_photo_open')}
              </span>
            </a>
            <p className="mt-2.5 text-xs text-[#16234e]/60 text-center">
              {t('finder.baggage_photo_help')}
            </p>
          </NavyEncart>
        )}

        {/* ═══ BLOC 2 : DÉTAILS DU VOYAGE / VOL — encart bandeau bleu de nuit (refonte-9) ═══ */}
        {baggage && (() => {
          const mode = safeTransportMode(baggage.transportMode) as TransportMode;
          const transportImg = getTransportImage(mode);
          const blockHeader = getTransportBlockHeader(mode, lang);

          return (
            <NavyEncart
              title={blockHeader}
              icon={<span className="text-base" aria-hidden>{getTransportIcon(mode)}</span>}
            >

              {/* TRANSPORT-FEATURE: Flight info */}
              {mode === 'flight' && (baggage.airlineName || baggage.flightNumber) && (
                <SoftEncart>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {baggage.airlineName && (
                        <div className="mb-1.5">
                          <p className="text-xs text-[#16234e]/60 font-medium">{t('transport.airline')}</p>
                          <p className="text-base font-bold text-[#16234e]">{baggage.airlineName}</p>
                        </div>
                      )}
                      {baggage.flightNumber && (
                        <div>
                          <p className="text-xs text-[#16234e]/60 font-medium">{t('transport.flight_number')}</p>
                          <p className="text-xl font-bold text-[#16234e] font-mono tracking-widest">{baggage.flightNumber}</p>
                        </div>
                      )}
                    </div>
                    <div className="h-12 w-12 rounded-full bg-[#2f9bff]/10 border border-[#2f9bff]/25 flex items-center justify-center ml-4 flex-shrink-0">
                      <Image
                        src={transportImg}
                        alt="flight"
                        width={28}
                        height={28}
                        className="mix-blend-multiply"
                      />
                    </div>
                  </div>
                </SoftEncart>
              )}

              {/* TRANSPORT-FEATURE: Train info */}
              {mode === 'train' && (baggage.trainCompany || baggage.trainNumber) && (
                <SoftEncart>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {baggage.trainCompany && (
                        <div className="mb-1.5">
                          <p className="text-xs text-[#16234e]/60 font-medium">{t('transport.train_company')}</p>
                          <p className="text-base font-bold text-[#16234e]">{baggage.trainCompany}</p>
                        </div>
                      )}
                      {baggage.trainNumber && (
                        <div>
                          <p className="text-xs text-[#16234e]/60 font-medium">{t('transport.train_number')}</p>
                          <p className="text-xl font-bold text-[#16234e] font-mono tracking-widest">{baggage.trainNumber}</p>
                        </div>
                      )}
                    </div>
                    <div className="h-12 w-12 rounded-full bg-[#2f9bff]/10 border border-[#2f9bff]/25 flex items-center justify-center ml-4 flex-shrink-0">
                      <Image
                        src={transportImg}
                        alt="train"
                        width={28}
                        height={28}
                        className="mix-blend-multiply"
                      />
                    </div>
                  </div>
                </SoftEncart>
              )}

              {/* TRANSPORT-FEATURE: Boat info */}
              {mode === 'boat' && (baggage.shipName || baggage.shipCabin) && (
                <SoftEncart>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {baggage.shipName && (
                        <div className="mb-1.5">
                          <p className="text-xs text-[#16234e]/60 font-medium">{t('transport.ship_name')}</p>
                          <p className="text-base font-bold text-[#16234e]">{baggage.shipName}</p>
                        </div>
                      )}
                      {baggage.shipCabin && (
                        <div>
                          <p className="text-xs text-[#16234e]/60 font-medium">{t('transport.ship_cabin')}</p>
                          <p className="text-base font-bold text-[#16234e]">{baggage.shipCabin}</p>
                        </div>
                      )}
                    </div>
                    <div className="h-12 w-12 rounded-full bg-[#2f9bff]/10 border border-[#2f9bff]/25 flex items-center justify-center ml-4 flex-shrink-0">
                      <Image
                        src={transportImg}
                        alt="boat"
                        width={28}
                        height={28}
                        className="mix-blend-multiply"
                      />
                    </div>
                  </div>
                </SoftEncart>
              )}

              {/* TRANSPORT-FEATURE: Bus info */}
              {mode === 'bus' && (baggage.busCompany || baggage.busLineNumber) && (
                <SoftEncart>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {baggage.busCompany && (
                        <div className="mb-1.5">
                          <p className="text-xs text-[#16234e]/60 font-medium">{t('transport.bus_company')}</p>
                          <p className="text-base font-bold text-[#16234e]">{baggage.busCompany}</p>
                        </div>
                      )}
                      {baggage.busLineNumber && (
                        <div>
                          <p className="text-xs text-[#16234e]/60 font-medium">{t('transport.bus_line')}</p>
                          <p className="text-base font-bold text-[#16234e]">{baggage.busLineNumber}</p>
                        </div>
                      )}
                    </div>
                    <div className="h-12 w-12 rounded-full bg-[#2f9bff]/10 border border-[#2f9bff]/25 flex items-center justify-center ml-4 flex-shrink-0">
                      <Image
                        src={transportImg}
                        alt="bus"
                        width={28}
                        height={28}
                        className="mix-blend-multiply"
                      />
                    </div>
                  </div>
                </SoftEncart>
              )}

              {/* Destination */}
              {baggage.destination && (
                <SoftEncart>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📍</span>
                    <div>
                      <p className="text-xs text-[#16234e]/60 font-medium">{t('transport.common_destination')}</p>
                      <p className="text-base font-bold text-[#16234e]">{baggage.destination}</p>
                    </div>
                  </div>
                </SoftEncart>
              )}

              {/* Departure Date */}
              {(baggage.departureDate || baggage.createdAt) && (
                <SoftEncart className="mb-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📅</span>
                    <div>
                      <p className="text-xs text-[#16234e]/60 font-medium">{t('transport.common_departure_date')}</p>
                      <p className="text-base font-bold text-[#16234e]">
                        {formatDate(baggage.departureDate || baggage.createdAt)}{baggage.departureTime ? ` — ${baggage.departureTime}` : ''}
                      </p>
                    </div>
                  </div>
                </SoftEncart>
              )}
            </NavyEncart>
          );
        })()}

        {/* ═══ BLOC 3 : DÉTAILS CONTACT — encart bandeau bleu de nuit (refonte-9) ═══ */}
        <NavyEncart
          title={t('finder.contact_section')}
          icon={<Phone className="w-4 h-4" aria-hidden />}
        >

          {/* ─── 1. BIG "📞 Contacter le propriétaire" CTA button (FIRST) ─── */}
          {!showForm && (
            <>
              <div className="text-center mb-4">
                <h2 className="text-lg md:text-xl font-black text-[#16234e]">
                  {t('finder.cta_ready_title')}
                </h2>
                <p className="text-xs md:text-sm text-[#16234e]/60 mt-1 flex items-center justify-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#2f9bff] flex-shrink-0" aria-hidden />
                  <span>{t('finder.cta_ready_subtitle')}</span>
                </p>
              </div>
              <motion.button
                onClick={() => setShowForm(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`${brandBtnGradient} w-full py-4 px-6 flex items-center justify-center gap-2 text-lg md:text-xl min-h-[60px] cursor-pointer`}
              >
                <Phone className="w-5 h-5" />
                <span>{t('finder.contact_owner_cta')}</span>
              </motion.button>
            </>
          )}

          {/* ─── 2 + 3. Form (revealed when CTA clicked): GPS button + form fields ─── */}
          {showForm && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">

              {/* GPS Success/Error indicators + dedicated GPS button REMOVED per refonte-6 brief.
                  GPS is now captured automatically inside the WhatsApp button click (silent fallback to manual location). */}

              {/* ─── Form fields: prénom, téléphone, lieu ─── */}

              {/* First name */}
              <input
                type="text"
                placeholder={t('finder.first_name')}
                aria-label={t('finder.first_name')}
                value={finderName}
                onChange={(e) => setFinderName(e.target.value)}
                className={brandInput}
              />

              {/* Phone (PhoneInput — carte blanche, champs brandInput du design system) */}
              <PhoneInput
                countryCode={finderPhoneCountry}
                onCountryChange={setFinderPhoneCountry}
                value={finderPhone}
                onChange={setFinderPhone}
                placeholder="6 12 34 56 78"
                required
                className="min-h-[48px]"
              />

              {/* Location */}
              <div>
                <input
                  type="text"
                  placeholder={t('finder.location_placeholder')}
                  aria-label={t('finder.location_placeholder')}
                  value={otherLocation}
                  onChange={(e) => setOtherLocation(e.target.value)}
                  className={brandInput}
                />
              </div>

              {/* ─── Contact choice: WhatsApp (GREEN + GPS auto) + Phone (YELLOW) ─── */}
              <div className="pt-1">
                <h3 className="text-[#16234e] text-xs font-bold uppercase tracking-widest text-center mb-2.5">
                  {t('finder.contact_choice')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* WhatsApp Button — GREEN #25D366 + GPS auto-captured on click */}
                  <button
                    onClick={handleWhatsApp}
                    disabled={isLocating || isSubmitting}
                    className="py-3.5 px-4 bg-[#25D366] hover:bg-[#1ebe5d] disabled:opacity-70 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 text-base min-h-[52px] shadow-lg shadow-[#25D366]/25 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                  >
                    {isLocating ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>{t('finder.locating')}</span>
                      </>
                    ) : isSubmitting ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>{t('finder.sending')}</span>
                      </>
                    ) : (
                      <>
                        <MessageCircle className="w-5 h-5" />
                        {t('finder.by_whatsapp')}
                      </>
                    )}
                  </button>
                  {/* Phone Button — navy officiel (brandBtnNavy, design system QRBags) */}
                  <button
                    onClick={handlePhoneCall}
                    disabled={isLocating || isSubmitting}
                    className={`${brandBtnNavy} py-3.5 px-4 flex items-center justify-center gap-2 text-base min-h-[52px] cursor-pointer`}
                  >
                    <Phone className="w-5 h-5" />
                    {t('finder.by_phone')}
                  </button>
                </div>

                {/* ─── CHAT-FEATURE : bouton CHAT anonyme — 3e choix, EN DESSOUS de WhatsApp/Appel ─── */}
                {!chatOpen && (
                  <div className="mt-2.5">
                    <button
                      type="button"
                      onClick={() => setChatOpen(true)}
                      className={`${brandBtnNavy} w-full py-3.5 px-4 flex items-center justify-center gap-2 text-base min-h-[52px] cursor-pointer`}
                      aria-label="Ouvrir le chat anonyme"
                    >
                      <MessageCircle className="w-5 h-5" />
                      CHAT
                    </button>
                    <p className="text-center text-xs font-semibold text-[#16234e]/50 mt-1.5">
                      Anonyme — sans laisser de numéro
                    </p>
                  </div>
                )}

                {/* CHAT-FEATURE : panneau du chat anonyme (remplace le bouton une fois ouvert) */}
                {chatOpen && (
                  <div className="mt-2.5">
                    <FinderChat
                      reference={reference}
                      defaultName={finderName}
                      onClose={() => setChatOpen(false)}
                    />
                  </div>
                )}

                <p className="text-[#16234e]/70 text-xs text-center mt-2.5 leading-relaxed">
                  {t('finder.gps_auto_shared')}
                </p>
              </div>
            </div>
          )}
        </NavyEncart>

        {/* ─── Trust Note ─── */}
        <div className="mt-1 mb-4 text-center text-xs text-[#16234e]/60 tracking-wide flex items-center justify-center gap-1.5">
          <Shield className="w-4 h-4 inline text-[#2f9bff]" />
          <span>{t('finder.trust_note')}</span>
        </div>
      </div>

      {/* AI-FEATURE: Chatbot Widget (Feature #1) — only on active/lost baggage */}
      {baggage && (baggageData?.status === 'active' || baggageData?.status === 'lost') && (
        <ChatbotWidget
          reference={reference}
          baggageContext={{
            destination: baggage.destination || undefined,
            city: otherLocation || undefined,
            agency: baggage.agency || undefined,
            status: baggage.status,
            transportMode: baggage.transportMode || undefined,
          }}
          locale={lang}
          t={t}
          dir={dir}
        />
      )}
    </main>
    </FinderShell>
  );
}
