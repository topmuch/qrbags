import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sécurité & RGPD — Vos données bagages protégées",
  description: "QRBags protège vos données personnelles : chiffrement, conformité RGPD, aucune donnée sensible publique. Découvrez ce que voit un trouveur quand il scanne le QR de votre bagage (et ce qu'il ne voit jamais).",
  keywords: ["rgpd bagage", "sécurité données qr", "confidentialité étiquette bagage", "protection données valise"],
  alternates: { canonical: "/fonctionnalites/securite-rgpd" },
};

export default function SecuriteRgpdLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
