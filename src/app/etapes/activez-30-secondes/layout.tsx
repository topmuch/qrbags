import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Étape 2 — Activez votre étiquette en 30 secondes",
  description: "Activation express de votre étiquette QRBags : scannez le QR, renseignez vos coordonnées WhatsApp, c'est tout. Votre bagage est immédiatement traçable en cas de perte ou d'objets trouvés.",
  keywords: ["activer étiquette bagage", "activation qr valise", "enregistrer bagage qr"],
  alternates: { canonical: "/etapes/activez-30-secondes" },
};

export default function Activez30SecondesLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
