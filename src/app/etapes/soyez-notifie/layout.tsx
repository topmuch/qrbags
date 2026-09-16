import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Étape 3 — Soyez notifié dès que votre bagage est trouvé",
  description: "Quelqu'un trouve votre bagage perdu et scanne le QR ? Vous recevez immédiatement une alerte WhatsApp avec la position du scan et les coordonnées du trouveur. Vos objets retrouvent leur propriétaire.",
  keywords: ["bagage trouvé notification", "objets trouvés alerte", "valise retrouvée", "trouveur bagage scan"],
  alternates: { canonical: "/etapes/soyez-notifie" },
};

export default function SoyezNotifieLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
