'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle, Luggage, Calendar, Backpack } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
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

  // ─── Empty state : pas d'activation data ───
  if (!activationData) {
    return (
      <BrandShell>
        <main className="min-h-screen flex items-center justify-center p-4">
          <BrandCard corners className="max-w-md w-full p-8 text-center">
            <div className="flex justify-center mb-4">
              <BrandIconRing size="w-16 h-16">
                <CheckCircle className="w-8 h-8 text-[#e6216e]" />
              </BrandIconRing>
            </div>
            <h1 className="text-[#16234e] text-2xl font-bold mb-2">
              ✅ Activation réussie !
            </h1>
            <p className="text-[#16234e]/70 mb-6">
              Votre bagage est maintenant protégé
            </p>
            <Link
              href="/inscrire"
              className={`${brandBtnGradient} inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[48px]`}
            >
              ← Revenir à l&apos;inscription
            </Link>
          </BrandCard>
        </main>
      </BrandShell>
    );
  }

  return (
    <BrandShell>
      <main className="min-h-screen flex items-center justify-center">
        {/* SuccessOverlay — feedback premium d'activation (indépendant du thème) */}
        <SuccessOverlay show={activationConfirmed} messageKey="activation.success" t={t} />

        <div className="max-w-md w-full py-8 px-4">
          {/* ═══ 1. En-tête succès ═══ */}
          <div className="text-center mb-6">
            <BrandIconRing size="w-20 h-20">
              <CheckCircle className="w-10 h-10 text-[#16234e]" />
            </BrandIconRing>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#16234e] mt-4">
              ✅ Activation réussie !
            </h1>
            <p className="text-[#16234e]/70 mt-1">Votre bagage est maintenant protégé</p>
          </div>

          {/* ═══ 2. Carte QR Code (coins viewfinder QR via BrandCard corners) ═══ */}
          <BrandCard corners className="p-5 mb-4 text-center">
            {/* QR Code sur fond blanc pour scan optimal */}
            <div className="bg-white rounded-xl p-3 inline-block mb-3 border border-[#16234e]/10 shadow-sm">
              <QRCodeSVG
                value={qrUrl}
                size={160}
                level="H"
                includeMargin={true}
                bgColor="#ffffff"
                fgColor={NAVY}
              />
            </div>
            <p className="font-mono font-bold text-lg break-all text-[#16234e]">
              {reference}
            </p>
            <p className="text-sm text-[#16234e]/60">
              {activationData.firstName} {activationData.lastName}
            </p>
          </BrandCard>

          {/* ═══ 3. Résumé Activité ═══ */}
          <BrandCard className="p-4 mb-4 space-y-3">
            <div className="flex items-center gap-3">
              <Luggage className="w-5 h-5 flex-shrink-0 text-[#2f9bff]" />
              <p className="font-medium text-sm text-[#16234e]">
                🧳 1 bagage activé •{' '}
                <span className="text-[#16234e]/60">Protection active</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 flex-shrink-0 text-[#2f9bff]" />
              <p className="font-medium text-sm text-[#16234e]">
                ⏰ Expire le {formatExpiration(activationData.expiresAt)} •{' '}
                <span className="text-[#16234e]/60">
                  Activé le {formatDate(activationData.activatedAt)}
                </span>
              </p>
            </div>
          </BrandCard>

          {/* ═══ 4. Boutons d'Action (flex-col mobile, flex-row md) ═══ */}
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            {/* Bouton A : Suivre mon bagage (target _blank) */}
            <a
              href={`/suivi/${reference}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Suivre mon bagage dans un nouvel onglet"
              className={`${brandBtnGradient} flex-1 inline-flex items-center justify-center gap-2 px-4 py-3.5 min-h-[52px]`}
            >
              📍 Suivre mon bagage
            </a>

            {/* Bouton B : Partager (Web Share API + fallback clipboard) */}
            <button
              onClick={handleShare}
              aria-label="Partager le lien de suivi"
              className={`${brandBtnNavy} flex-1 inline-flex items-center justify-center gap-2 px-4 py-3.5 min-h-[52px] cursor-pointer`}
            >
              📤 Partager
            </button>
          </div>

          {/* ═══ 4bis. Bouton Passeport QRBags (carte numérique du bagage) ═══ */}
          <a
            href={`/passeport/${reference}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Voir mon Passeport QRBags dans un nouvel onglet"
            className={`${brandBtnOutline} w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 min-h-[52px] mb-4`}
          >
            🛂 Mon Passeport QRBags
          </a>

          {/* ═══ 5. Encart Checklist ═══ */}
          <BrandCard className="p-5 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Backpack className="w-5 h-5 text-[#e6216e]" />
              <h2 className="text-[#16234e] font-bold text-base">
                🎒 Préparez votre voyage sereinement
              </h2>
            </div>
            <Link
              href="/checklist"
              className={`${brandBtnGradient} inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[48px] mt-3`}
            >
              Créer ma checklist gratuite →
            </Link>
          </BrandCard>

          {/* Tagline étiquette officielle */}
          <p className="text-center text-[#16234e]/50 text-xs mt-6">
            Solution intelligente de suivi de bagages
          </p>
        </div>
      </main>
    </BrandShell>
  );
}

export default function SuccessPage() {
  return <SuccessContent />;
}
