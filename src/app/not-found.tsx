'use client';

import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';
import {
  BrandShell,
  BrandCard,
  BrandLogo,
  brandBtnGradient,
  brandBtnOutline,
} from '@/components/brand/BrandShell';

export default function NotFound() {
  return (
    <BrandShell>
      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 text-center">
        {/* Logo — retour accueil */}
        <div className="flex items-center justify-center mb-8">
          <BrandLogo className="h-14 w-auto" />
        </div>

        {/* 404 — dégradé signature QRBag */}
        <h1
          className="text-7xl sm:text-8xl font-extrabold leading-none text-gradient-qrbag mb-6"
          aria-label="Erreur 404"
        >
          404
        </h1>

        {/* Carte message + actions (coins viewfinder QR) */}
        <BrandCard corners className="max-w-md w-full p-8 sm:p-10">
          <h2 className="text-2xl font-bold text-[#16234e] mb-4">
            Page non trouvée
          </h2>
          <p className="text-[#16234e]/70 leading-relaxed mb-8">
            La page que vous recherchez n&apos;existe pas ou a été déplacée. Vérifiez
            l&apos;URL ou retournez à l&apos;accueil.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              aria-label="Retour à la page d'accueil QRBag"
              className={`${brandBtnGradient} inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[48px]`}
            >
              <Home className="w-5 h-5" />
              Retour à l&apos;accueil
            </Link>
            <button
              onClick={() => window.history.back()}
              aria-label="Revenir à la page précédente"
              className={`${brandBtnOutline} inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[48px] cursor-pointer`}
            >
              <ArrowLeft className="w-5 h-5" />
              Page précédente
            </button>
          </div>
        </BrandCard>

        {/* Aide */}
        <p className="text-[#16234e]/60 text-sm mt-8">
          Besoin d&apos;aide ?{' '}
          <Link
            href="/contact"
            className="text-[#2f9bff] font-semibold hover:underline"
          >
            Contactez-nous
          </Link>
        </p>
      </main>
    </BrandShell>
  );
}
