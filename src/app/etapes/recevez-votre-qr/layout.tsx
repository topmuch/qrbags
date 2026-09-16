import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Étape 1 — Recevez votre étiquette QR bagage",
  description: "Recevez votre étiquette QRBags à domicile : autocollant QR résistant (eau, abrasion) à coller sur votre valise, sac de cabine ou bagage de soute. Livraison dans toute la francophonie.",
  keywords: ["recevoir étiquette qr bagage", "livraison étiquette valise", "autocollant qr résistant"],
  alternates: { canonical: "/etapes/recevez-votre-qr" },
};

export default function RecevezVotreQrLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
