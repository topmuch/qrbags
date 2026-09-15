import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact QRBags — Support bagages perdus & trouvés",
  description: "Contactez l'équipe QRBags pour toute question sur vos étiquettes QR, un bagage perdu ou trouvé, ou un partenariat. Support en français : France, Belgique, Suisse, Luxembourg, Canada, Afrique francophone.",
  keywords: ["contact qrbags", "support bagage perdu", "aide valise perdue", "service client qrbags"],
  alternates: { canonical: "/contact" },
};

export default function ContactLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
