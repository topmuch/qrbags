import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Devenir partenaire — Agences de voyage & compagnies",
  description: "Agences de voyage, compagnies aériennes, hôtels et aéroports : proposez QRBags à vos clients et réduisez les litiges de bagages perdus. Programme partenaire France, Belgique, Suisse, Canada, Sénégal et Afrique francophone.",
  keywords: ["agence de voyage partenaire", "solution bagage perdu agence", "partenaire aéroport", "programme bagage compagnie aérienne", "revendeur étiquette QR"],
  alternates: { canonical: "/devenir-partenaire" },
};

export default function DevenirPartenaireLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
