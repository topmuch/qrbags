import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Étape 4 — Voyagez serein avec vos bagages protégés",
  description: "Avec QRBags, voyagez l'esprit tranquille : vos bagages sont traçables partout dans le monde, sans application, sans batterie, sans GPS. La tranquillité pour 5€/an par bagage.",
  keywords: ["voyager serein", "bagage protégé", "assurance valise perdue", "voyage tranquille bagage"],
  alternates: { canonical: "/etapes/voyagez-serein" },
};

export default function VoyagezSereinLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
