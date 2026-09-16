import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Activer mon étiquette QRBags",
  description: "Activez votre étiquette QRBags en 30 secondes : renseignez vos informations, recevez votre QR personnel et vos documents. Votre bagage devient traçable en cas de perte.",
  keywords: ["activer étiquette QR", "inscription bagage QR", "enregistrer valise"],
  alternates: { canonical: "/inscrire" },
};

export default function InscrireLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
