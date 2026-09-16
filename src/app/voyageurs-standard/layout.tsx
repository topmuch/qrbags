import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Protéger sa valise en avion — Étiquette QR voyageur",
  description: "Solution pour retrouver une valise perdue en avion : collez l'étiquette QRBags sur votre bagage, le trouveur scanne le QR et vous êtes alerté sur WhatsApp avec sa position. Idéal pour tous les voyages en France, Europe, Canada et Afrique.",
  keywords: ["protéger valise avion", "valise perdue avion", "étiquette valise avion", "bagage en soute perdu", "retrouver valise avion", "étiquette bagage voyage"],
  alternates: { canonical: "/voyageurs-standard" },
};

export default function VoyageursStandardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
