'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Luggage,
  Calendar,
  Backpack,
  ScanLine,
  Sticker,
  Plane,
  Copy,
  Home,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import SuccessOverlay from '@/components/ui/SuccessOverlay';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from '@/hooks/use-toast';
import {
  brandBtnGradient,
  brandBtnNavy,
  brandBtnOutline,
  BrandShell,
  BrandCard,
  BrandIconRing,
} from '@/components/brand/BrandShell';

// Navy officiel de l'étiquette QRBag — QR code (fgColor) pour un scan optimal
const NAVY = '#16234e';

/* ─── ConfettiBurst — pluie de confettis signature (palette QRBag, zéro dépendance) ───
   Valeurs pseudo-aléatoires déterministes (seed par index) : rendu identique
   serveur/client, donc aucune erreur d'hydratation. */
const CONFETTI_COLORS = ['#f8921f', '#e6216e', '#8b17c9', '#2f9bff', '#ffd200'];

function seededRand(seed: number): number {
  const x = Math.sin(seed * 999.7 + 12.3) * 10000;
  return x - Math.floor(x);
}

function ConfettiBurst({ count = 28 }: { count?: number }) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    left: seededRand(i + 1) * 100,
    delay: seededRand(i + 31) * 1.6,
    duration: 3 + seededRand(i + 61) * 2.6,
    size: 5 + seededRand(i + 91) * 6,
    drift: (seededRand(i + 121) - 0.5) * 70,
    spin: 180 + seededRand(i + 151) * 540,
    fall: 280 + seededRand(i + 181) * 180,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    round: seededRand(i + 211) > 0.5,
  }));

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute block top-0"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.round ? p.size : p.size * 0.45,
            backgroundColor: p.color,
            borderRadius: p.round ? '9999px' : '2px',
          }}
          initial={{ y: -24, x: 0, opacity: 0, rotate: 0 }}
          animate={{ y: p.fall, x: p.drift, opacity: [0, 1, 1, 0], rotate: p.spin }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            repeatDelay: 1.8,
            ease: 'easeIn',
            opacity: { times: [0, 0.08, 0.75, 1] },
          }}
        />
      ))}
    </div>
  );
}

interface ActivationData {
  reference: string;
  firstName: string;
  lastName: string;
  whatsapp: string;
  flightNumber?: string;
  destination?: string;
  type: string;
  activatedAt: string;
  expiresAt?: string;
  // TRANSPORT-FEATURE: Transport mode + conditional fields (conservés pour sessionStorage, non affichés)
  transportMode?: string;
  trainNumber?: string;
  shipName?: string;
  busLineNumber?: string;
}

function SuccessContent() {
  const [activationData, setActivationData] = useState<ActivationData | null>(null);
  const { t } = useTranslation();

  // Lecture unique de sessionStorage au mount — pattern légitime (storage externe non disponible au SSR)
  useEffect(() => {
    const storedData = sessionStorage.getItem('activationData');
    if (storedData) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActivationData(JSON.parse(storedData));
      } catch (e) {
        console.error('Error parsing activation data:', e);
      }
    }
  }, []);

  // Valeur dérivée — évite un useEffect + setState redondant
  const activationConfirmed = activationData !== null;

  const reference = activationData?.reference || '';
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const trackingUrl = `${origin}/suivi/${reference}`;
  const qrUrl = `${origin}/scan/${reference}`;

  // Format date (avec heure)
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format expiration date (sans heure)
  const formatExpiration = (dateString?: string) => {
    if (!dateString) return 'Selon formule';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Web Share API + fallback clipboard
  const handleShare = async () => {
    if (!reference) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mon bagage QRBag',
          text: 'Suivez mon bagage en temps réel avec QRBag.',
          url: trackingUrl,
        });
      } catch (err) {
        // Annulation utilisateur ou erreur — silencieux
      }
    } else {
      try {
        await navigator.clipboard.writeText(trackingUrl);
        toast({
          title: 'Lien copié !',
          description: 'Le lien de suivi a été copié dans le presse-papiers.',
        });
      } catch (err) {
        toast({
          title: 'Impossible de copier le lien',
          description: 'Votre navigateur ne supporte pas le copier-coller automatique.',
          variant: 'destructive',
        });
      }
    }
  };

  // Référence copiable — presse-papiers + toast (infra toast déjà présente)
  const handleCopyReference = async () => {
    if (!reference) return;
    try {
      await navigator.clipboard.writeText(reference);
      toast({
        title: t('success.ref_copied_title'),
        description: t('success.ref_copied_desc'),
      });
    } catch (err) {
      toast({
        title: t('success.copy_fail_title'),
        variant: 'destructive',
      });
    }
  };

  // ─── Empty state : pas d'activation data ───
  if (!activationData) {
    return (
      <BrandShell>
        <main className="min-h-screen flex items-center justify-center p-4">
          <BrandCard corners className="max-w-md w-full p-8 text-center">
            <div className="flex justify-center mb-4">
              <BrandIconRing size="w-16 h-16">
                <img src="/logo.png" alt="Logo QRBag" className="w-11 h-11 object-contain rounded-xl" aria-hidden />
              </BrandIconRing>
            </div>
            <h1 className="text-[#16234e] text-2xl font-bold mb-2">
              {t('success.success_title')}
            </h1>
            <p className="text-[#16234e]/70 mb-6">
              {t('success.success_subtitle')}
            </p>
            <Link
              href="/inscrire"
              className={`${brandBtnGradient} inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[48px]`}
            >
              {t('success.back_to_inscrire')}
            </Link>
          </BrandCard>
        </main>
      </BrandShell>
    );
  }

  const firstName = activationData.firstName?.trim() || '';
  const congratsTitle = firstName
    ? t('success.congrats_title', { firstName })
    : t('success.congrats_default');

  return (
    <BrandShell>
      <main className="min-h-screen flex items-center justify-center">
        {/* SuccessOverlay — feedback premium d'activation (indépendant du thème) */}
        <SuccessOverlay show={activationConfirmed} messageKey="activation.success" t={t} />

        <div className="max-w-md w-full py-8 px-4">
          {/* ═══ 🎉 HERO CÉLÉBRATION — bandeau dégradé + confettis + cercle Check ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="mb-4"
          >
            <BrandCard corners className="w-full">
              {/* Bandeau dégradé signature (orange → rouge → magenta → violet) */}
              <div className="relative bg-gradient-qrbag rounded-t-[23px] overflow-hidden px-5 pt-7 pb-6 text-center">
                <div className="absolute inset-0 dotted-map-light opacity-60 pointer-events-none" aria-hidden />
                <div className="absolute -top-12 -left-10 w-36 h-36 rounded-full bg-white/15 blur-2xl" aria-hidden />
                <div className="absolute -bottom-14 -right-8 w-44 h-44 rounded-full bg-[#ffd200]/25 blur-2xl" aria-hidden />
                <span className="absolute top-3 right-4 text-xl" aria-hidden>✨</span>
                <span className="absolute bottom-4 left-4 text-lg" aria-hidden>🎉</span>

                {/* Pluie de confettis signature */}
                <ConfettiBurst />

                {/* Grand cercle animé — logo QRBag (coins arrondis) sur anneau dégradé */}
                <div className="relative w-20 h-20 mx-auto mb-3">
                  <motion.div
                    animate={{ scale: [1, 1.06, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-20 h-20 rounded-full bg-white/15 border-2 border-white/40 backdrop-blur-sm flex items-center justify-center shadow-xl shadow-[#16234e]/25"
                  >
                    <motion.span
                      initial={{ scale: 0, rotate: -30 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', bounce: 0.5, delay: 0.15 }}
                      className="flex"
                    >
                      <img src="/logo.png" alt="Logo QRBag" className="w-14 h-14 object-contain rounded-2xl bg-white shadow-md" aria-hidden />
                    </motion.span>
                  </motion.div>
                  <span
                    className="absolute inset-0 rounded-full border-2 border-white/50 animate-ping [animation-duration:2.4s]"
                    aria-hidden
                  />
                </div>

                <h1 className="relative text-2xl md:text-3xl font-black text-white leading-tight tracking-tight drop-shadow-sm">
                  {congratsTitle}
                </h1>
                <p className="relative mt-1.5 text-sm md:text-base text-white/90 leading-relaxed max-w-md mx-auto font-medium">
                  {t('success.protected_subtitle')}
                </p>

                {/* Pilule référence bagage */}
                <p className="relative mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-white font-mono font-bold text-xs tracking-widest max-w-full">
                  <Luggage className="w-3.5 h-3.5 flex-shrink-0" aria-hidden />
                  <span className="truncate">{reference}</span>
                </p>
              </div>

              {/* Bandeau 3 étapes — « Et maintenant ? » */}
              <div className="px-4 py-4 bg-white">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#16234e]/50 text-center mb-2.5">
                  {t('success.steps_title')}
                </p>
                <ol className="grid grid-cols-3 gap-2">
                  {[
                    { icon: Sticker, color: '#f8921f', title: t('success.step1_title'), desc: t('success.step1_desc') },
                    { icon: ScanLine, color: '#2f9bff', title: t('success.step2_title'), desc: t('success.step2_desc') },
                    { icon: Plane, color: '#8b17c9', title: t('success.step3_title'), desc: t('success.step3_desc') },
                  ].map((s, i) => (
                    <li key={i} className="relative text-center px-1">
                      <div
                        className="w-10 h-10 mx-auto mb-1.5 rounded-2xl flex items-center justify-center shadow-md"
                        style={{ backgroundColor: `${s.color}1A`, border: `1.5px solid ${s.color}55` }}
                      >
                        <s.icon className="w-5 h-5" style={{ color: s.color }} aria-hidden />
                      </div>
                      <p className="text-[11px] md:text-xs font-extrabold text-[#16234e] leading-tight">{s.title}</p>
                      <p className="hidden sm:block text-[10px] text-[#16234e]/55 leading-snug mt-0.5">{s.desc}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </BrandCard>
          </motion.div>

          {/* ═══ 2. Carte QR Code — cadre navy + BrandCorners + référence copiable ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5, ease: 'easeOut' }}
          >
            <BrandCard corners className="p-5 mb-4 text-center">
              {/* QR Code sur fond blanc dans un cadre navy pour scan optimal */}
              <div className="relative mx-auto w-fit rounded-2xl bg-[#16234e] p-3.5 shadow-lg shadow-[#16234e]/25">
                <div className="absolute inset-0 dotted-map-light opacity-40 rounded-2xl pointer-events-none" aria-hidden />
                <div className="relative bg-white rounded-xl p-2.5 border border-[#16234e]/10">
                  <QRCodeSVG
                    value={qrUrl}
                    size={160}
                    level="H"
                    includeMargin={true}
                    bgColor="#ffffff"
                    fgColor={NAVY}
                  />
                </div>
              </div>

              {/* Référence en pilule copiable + bouton copier (toast) */}
              <div className="flex items-center justify-center gap-2 mt-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#16234e]/5 border border-[#16234e]/10 font-mono font-bold text-sm text-[#16234e] tracking-wider max-w-[72%]">
                  <span className="truncate">{reference}</span>
                </span>
                <button
                  type="button"
                  onClick={handleCopyReference}
                  aria-label={t('success.copy_ref')}
                  title={t('success.copy_ref')}
                  className="w-11 h-11 rounded-full bg-[#16234e] hover:bg-[#0f1838] text-white flex items-center justify-center shadow-md transition-all hover:scale-105 active:scale-95 flex-shrink-0"
                >
                  <Copy className="w-4 h-4" aria-hidden />
                </button>
              </div>

              {/* Consigne étiquette */}
              <p className="mt-3.5 text-sm text-[#16234e]/70 leading-relaxed flex items-center justify-center gap-1.5 flex-wrap">
                <Sticker className="w-4 h-4 text-[#8b17c9] flex-shrink-0" aria-hidden />
                {t('success.sticker_hint')}
              </p>
            </BrandCard>
          </motion.div>

          {/* ═══ 3. Résumé — bagage activé + dates propres ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5, ease: 'easeOut' }}
          >
            <BrandCard className="p-4 mb-4 space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-[#2f9bff]/10 border border-[#2f9bff]/25 flex items-center justify-center flex-shrink-0" aria-hidden>
                  <Luggage className="w-[18px] h-[18px] text-[#2f9bff]" />
                </span>
                <p className="font-medium text-sm text-[#16234e]">
                  🧳 {t('success.bag_activated')} •{' '}
                  <span className="text-[#16234e]/60">{t('success.protection_active')}</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-[#2f9bff]/10 border border-[#2f9bff]/25 flex items-center justify-center flex-shrink-0" aria-hidden>
                  <Calendar className="w-[18px] h-[18px] text-[#2f9bff]" />
                </span>
                <p className="font-medium text-sm text-[#16234e]">
                  ⏰ {t('success.expires_on')}{' '}
                  <span className="font-bold">{formatExpiration(activationData.expiresAt)}</span>{' '}
                  •{' '}
                  <span className="text-[#16234e]/60">
                    {t('success.activated_on')} {formatDate(activationData.activatedAt)}
                  </span>
                </p>
              </div>
            </BrandCard>
          </motion.div>

          {/* ═══ 4. CTA principal — Tester mon QR (dégradé XL) ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5, ease: 'easeOut' }}
            className="space-y-3 mb-4"
          >
            <Link
              href={`/scan/${reference}`}
              aria-label={t('success.test_qr')}
              className={`group ${brandBtnGradient} w-full inline-flex items-center justify-center gap-2 px-4 py-4 text-lg min-h-[56px]`}
            >
              <ScanLine className="w-5 h-5" aria-hidden />
              {t('success.test_qr')}
            </Link>

            {/* Actions secondaires (flex-col mobile, flex-row md) */}
            <div className="flex flex-col md:flex-row gap-3">
              {/* Bouton A : Suivre mon bagage (target _blank) */}
              <a
                href={`/suivi/${reference}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Suivre mon bagage dans un nouvel onglet"
                className={`${brandBtnNavy} flex-1 inline-flex items-center justify-center gap-2 px-4 py-3.5 min-h-[52px]`}
              >
                {t('success.track_baggage')}
              </a>

              {/* Bouton B : Partager (Web Share API + fallback clipboard) */}
              <button
                onClick={handleShare}
                aria-label="Partager le lien de suivi"
                className={`${brandBtnNavy} flex-1 inline-flex items-center justify-center gap-2 px-4 py-3.5 min-h-[52px] cursor-pointer`}
              >
                {t('success.share')}
              </button>
            </div>

            {/* Bouton Passeport QRBags (carte numérique du bagage) */}
            <a
              href={`/passeport/${reference}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Voir mon Passeport QRBags dans un nouvel onglet"
              className={`${brandBtnOutline} w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 min-h-[52px]`}
            >
              {t('success.passport')}
            </a>

            {/* Retour à l'accueil */}
            <Link
              href="/"
              className={`${brandBtnOutline} w-full inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[48px]`}
            >
              <Home className="w-4 h-4" aria-hidden />
              {t('common.back_home')}
            </Link>
          </motion.div>

          {/* ═══ 5. Encart Checklist ═══ */}
          <BrandCard className="p-5 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Backpack className="w-5 h-5 text-[#e6216e]" aria-hidden />
              <h2 className="text-[#16234e] font-bold text-base">
                {t('success.checklist_title')}
              </h2>
            </div>
            <Link
              href="/checklist"
              className={`${brandBtnGradient} inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[48px] mt-3`}
            >
              {t('success.checklist_cta')}
            </Link>
          </BrandCard>

          {/* Tagline étiquette officielle */}
          <p className="text-center text-[#16234e]/50 text-xs mt-6">
            {t('success.tagline')}
          </p>
        </div>
      </main>
    </BrandShell>
  );
}

export default function SuccessPage() {
  return <SuccessContent />;
}
