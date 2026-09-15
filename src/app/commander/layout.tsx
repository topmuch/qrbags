import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Commander mon étiquette QR bagage",
  description: "Commandez votre étiquette QRBags : un autocollant QR intelligent collé sur votre valise pour la retrouver si elle est perdue à l'aéroport. Livraison rapide en France, Europe, Canada et Afrique francophone.",
  keywords: ["commander étiquette bagage", "acheter étiquette valise QR", "sticker bagage intelligent", "prix étiquette bagage"],
  alternates: { canonical: "/commander" },
};

/* 🎯 SEO — Données structurées Product + AggregateOffer
   Rich results Google : prix, disponibilité, avis potentiels
   sur les requêtes « acheter étiquette bagage », « prix étiquette valise ». */
const productJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Étiquette QR bagage QRBags",
  description:
    "Étiquette QR intelligente à coller sur votre valise : si votre bagage est perdu à l'aéroport, le trouveur scanne le QR et vous êtes alerté sur WhatsApp avec sa position. Sans application, sans batterie, sans GPS.",
  brand: { "@type": "Brand", name: "QRBags" },
  category: "Accessoire voyage > Étiquette bagage",
  image: "https://qrbags.com/icons/icon-512x512.png",
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "EUR",
    lowPrice: 5,
    highPrice: 12,
    offerCount: 3,
    offers: [
      {
        "@type": "Offer",
        name: "Sticker Solo — 2 bagages protégés",
        price: 5,
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        url: "https://qrbags.com/commander",
      },
      {
        "@type": "Offer",
        name: "Pack Famille — 6 bagages protégés",
        price: 12,
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        url: "https://qrbags.com/commander",
      },
      {
        "@type": "Offer",
        name: "Pack Hajj & Omra — 3 bagages par pèlerin",
        price: 5,
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        url: "https://qrbags.com/commander",
      },
    ],
  },
};

export default function CommanderLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      {children}
    </>
  );
}
