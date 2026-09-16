import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Étiquette bagage sans batterie — vs traceur GPS",
  description: "Comparatif : étiquette QRBags sans batterie (5€/an, illimitée, 0 entretien) vs traceur GPS bagage (30-150€, pile à remplacer). Pourquoi le QR est la solution la plus fiable pour retrouver une valise perdue.",
  keywords: ["étiquette bagage sans batterie", "traceur gps valise", "balise bagage avion", "gps valise comparatif", "tracker bagage prix"],
  alternates: { canonical: "/fonctionnalites/sans-batterie" },
};

export default function SansBatterieLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
