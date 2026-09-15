import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Alerte WhatsApp quand votre bagage est scanné",
  description: "Recevez une notification WhatsApp instantanée dès que quelqu'un scanne le QR de votre valise trouvée : localisation du scan, message du trouveur et contact direct. Retrouvez votre bagage perdu en quelques minutes.",
  keywords: ["alerte bagage trouvé", "notification whatsapp bagage", "valise trouvée alerte", "objets trouvés notification"],
  alternates: { canonical: "/fonctionnalites/alertes-whatsapp" },
};

export default function AlertesWhatsappLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
