import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Avis voyageurs QRBags — Partagez votre expérience",
  description: "Lisez les avis des voyageurs QRBags et partagez votre expérience : bagages retrouvés, voyage serein, protection QR efficace. Publiez votre avis sans compte, en moins d'une minute.",
  keywords: ["avis qrbags", "avis voyageurs", "témoignages bagages", "avis étiquette qr bagage"],
  alternates: { canonical: "/avis" },
};

export default function AvisLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
