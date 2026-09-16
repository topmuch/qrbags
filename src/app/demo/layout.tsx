import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Démo QRBags — Testez le scan QR bagage",
  description: "Démo interactive QRBags : découvrez comment un simple scan de l'étiquette QR retrouve un bagage perdu et alerte son propriétaire en temps réel sur WhatsApp.",
  keywords: ["démo QR bagage", "test étiquette bagage", "comment ça marche QR valise"],
  alternates: { canonical: "/demo" },
};

export default function DemoLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
