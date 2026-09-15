'use client';

import {
  BrandShell,
  BrandCard,
  BrandIconRing,
  brandBtnGradient,
} from '@/components/brand/BrandShell';

export default function OfflinePage() {
  return (
    <BrandShell>
      <main className="min-h-screen flex items-center justify-center p-4">
        {/* Carte principale (coins viewfinder QR) */}
        <BrandCard corners className="max-w-md w-full p-8 sm:p-10 text-center">
          {/* Icône QR — anneau dégradé signature, halo azure (hors-ligne) */}
          <div className="flex justify-center mb-6">
            <BrandIconRing size="w-20 h-20" glow="#2f9bff">
              <svg
                className="w-10 h-10 text-[#16234e]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="3" height="3" />
                <rect x="18" y="18" width="3" height="3" />
              </svg>
            </BrandIconRing>
          </div>

          {/* Titre */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#16234e] mb-3">
            Pas de connexion
          </h1>
          <p className="text-[#16234e]/70 leading-relaxed mb-8">
            Vérifiez votre connexion internet et réessayez.
          </p>

          {/* Réessayer — bouton dégradé signature */}
          <button
            onClick={() => window.location.reload()}
            aria-label="Recharger la page"
            className={`${brandBtnGradient} inline-flex items-center justify-center gap-2 px-8 py-3 min-h-[48px] cursor-pointer`}
          >
            Réessayer
          </button>

          {/* Info */}
          <p className="mt-8 text-[#16234e]/50 text-sm">
            QRBag fonctionne également hors ligne pour les fonctions de base.
          </p>
        </BrandCard>
      </main>
    </BrandShell>
  );
}
