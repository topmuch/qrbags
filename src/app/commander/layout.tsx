import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Commander mon étiquette QR bagage",
  description: "Commandez votre étiquette QRBags : un autocollant QR intelligent collé sur votre valise pour la retrouver si elle est perdue à l'aéroport. Livraison rapide en France, Europe, Canada et Afrique francophone.",
  keywords: ["commander étiquette bagage", "acheter étiquette valise QR", "sticker bagage intelligent", "prix étiquette bagage"],
  alternates: { canonical: "/commander" },
};

export default function CommanderLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
