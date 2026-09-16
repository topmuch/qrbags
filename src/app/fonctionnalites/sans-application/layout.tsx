import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Étiquette bagage sans application — Scan direct navigateur",
  description: "QRBags fonctionne sans application : le trouveur scanne le QR avec l'appareil photo de son téléphone, la page s'ouvre dans le navigateur et vous êtes alerté. Aucune installation nécessaire pour retrouver un bagage perdu.",
  keywords: ["étiquette bagage sans application", "QR sans app", "trouver valise sans application", "scan QR navigateur"],
  alternates: { canonical: "/fonctionnalites/sans-application" },
};

export default function SansApplicationLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
