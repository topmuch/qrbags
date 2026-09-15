'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Clock,
  MessageCircle,
  Home,
  RefreshCw,
  Shield,
  AlertTriangle,
} from 'lucide-react';
import {
  BrandShell,
  BrandCard,
  BrandIconRing,
  brandBtnNavy,
} from '@/components/brand/BrandShell';

function ExpiredContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get('ref') || '';
  const agencyName = searchParams.get('agency') || '';
  const expiredAt = searchParams.get('expired') || '';

  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      `Bonjour,\n\n` +
        `J'ai scanné un QR code QRBag qui a expiré.\n\n` +
        `📦 Référence: ${reference}\n` +
        `📅 Expiré le: ${formatDate(expiredAt)}\n\n` +
        `Je souhaite renouveler la protection de ce bagage.`
    );
    window.open(`https://wa.me/33745349339?text=${message}`, '_blank');
  };

  return (
    <BrandShell>
      <main className="min-h-screen flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full py-10">
          {/* ═══ Carte principale (coins viewfinder QR) ═══ */}
          <BrandCard corners className="p-6 sm:p-8 text-center">
            {/* Icône horloge — anneau dégradé signature */}
            <div className="flex justify-center mb-5">
              <BrandIconRing size="w-20 h-20" glow="#e6216e">
                <Clock className="w-10 h-10 text-[#e6216e]" />
              </BrandIconRing>
            </div>

            {/* Titre */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#16234e] mb-3">
              Ce QR code est expiré
            </h1>

            <p className="text-[#16234e]/70 leading-relaxed mb-6">
              Le bagage associé à{' '}
              <span className="font-mono font-bold text-[#16234e] bg-[#16234e]/5 border border-[#16234e]/10 px-2 py-0.5 rounded-md break-all">
                {reference || 'ce code'}
              </span>
              {expiredAt && (
                <>
                  {' '}
                  n&apos;est plus protégé depuis le{' '}
                  <span className="text-[#16234e] font-semibold">
                    {formatDate(expiredAt)}
                  </span>
                  .
                </>
              )}
            </p>

            {/* Encart info — violet doux (couleur « renouvellement » de la charte) */}
            <div className="bg-[#8b17c9]/5 border border-[#8b17c9]/15 rounded-xl p-4 mb-6 text-left">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-[#8b17c9] shrink-0 mt-0.5" />
                <div>
                  <p className="text-[#8b17c9] font-bold text-sm">Que faire ?</p>
                  <p className="text-[#16234e]/70 text-sm mt-1">
                    Si vous êtes le propriétaire, contactez votre agence pour générer un
                    nouveau QR code. Si vous avez trouvé ce bagage, vous pouvez nous
                    contacter pour aider à le retrouver.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              {/* WhatsApp — vert de marque WhatsApp (#25D366), inchangé */}
              <button
                onClick={handleWhatsApp}
                aria-label="Contacter QRBag via WhatsApp pour renouveler la protection"
                className="w-full min-h-[48px] py-3.5 bg-[#25D366] text-white rounded-2xl font-bold hover:bg-[#128C7E] hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/25 cursor-pointer"
              >
                <MessageCircle className="w-5 h-5" />
                Contacter via WhatsApp
              </button>

              {agencyName && (
                <p className="text-sm text-[#16234e]/60">
                  Agence :{' '}
                  <span className="text-[#16234e] font-semibold">{agencyName}</span>
                </p>
              )}

              <button
                onClick={() => router.push('/')}
                aria-label="Retour à la page d'accueil QRBag"
                className={`${brandBtnNavy} w-full min-h-[48px] py-3.5 flex items-center justify-center gap-2 cursor-pointer`}
              >
                <Home className="w-5 h-5" />
                Retour à l&apos;accueil
              </button>
            </div>
          </BrandCard>

          {/* ═══ Encart « Comment renouveler » ═══ */}
          <BrandCard className="p-4 mt-4">
            <div className="flex items-start gap-3">
              <RefreshCw className="w-5 h-5 text-[#2f9bff] shrink-0 mt-0.5" />
              <div>
                <p className="text-[#16234e] font-bold text-sm">
                  Comment renouveler ?
                </p>
                <p className="text-[#16234e]/60 text-xs mt-1 leading-relaxed">
                  Contactez votre agence de voyage ou rendez-vous sur QRBag.com pour
                  générer un nouveau QR code. La protection standard dure 7 jours, et
                  jusqu&apos;à 1 an avec un tag premium.
                </p>
              </div>
            </div>
          </BrandCard>

          {/* Footer */}
          <div className="mt-8 text-center text-[#16234e]/50 text-xs">
            <Shield className="w-4 h-4 inline mr-1" />
            QRBag – Protégez vos bagages, en toute sérénité
          </div>
        </div>
      </main>
    </BrandShell>
  );
}

export default function ExpiredQRPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-[#16234e]/15 border-t-[#e6216e] rounded-full"></div>
        </div>
      }
    >
      <ExpiredContent />
    </Suspense>
  );
}
