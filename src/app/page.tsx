import type { Metadata } from 'next';
import HomePageContent from './page-content';

// SEO Metadata optimisées pour le Sénégal
export const metadata: Metadata = {
  title: 'QRBag Sénégal | Étiquettes QR pour Bagages Perdus',
  description: 'Protégez vos bagages avec QRBag au Sénégal. Scan instantané, géolocalisation, récupération en 24h. Idéal pour voyageurs, pèlerins Hajj et agences de voyage à Dakar.',
  keywords: ['bagage perdu Dakar', 'QR code bagage Sénégal', 'Hajj bagage', 'agence voyage Dakar', 'étiquette bagage perdue', 'protection bagage Sénégal', 'QRBag', 'bagage perdu AIBD', 'pèlerin Hajj Sénégal'],
  openGraph: {
    title: 'QRBag Sénégal | Protection intelligente des bagages',
    description: 'La solution anti-bagage perdu au Sénégal. Étiquettes QR code pour voyageurs et pèlerins Hajj. Récupération en 24h.',
    url: 'https://qrbags.com',
    siteName: 'QRBag Sénégal',
    type: 'website',
    locale: 'fr_SN',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'QRBag - Étiquettes QR pour bagages au Sénégal',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'QRBag Sénégal | Étiquettes QR pour Bagages Perdus',
    description: 'Protégez vos bagages avec QRBag au Sénégal. Récupération en 24h.',
    images: ['/og-image.jpg'],
  },
  alternates: {
    canonical: 'https://qrbags.com',
  },
};

// Page d'accueil - Server Component avec metadata SEO
export default function Home() {
  return <HomePageContent />;
}
