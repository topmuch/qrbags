import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "À propos de QRBags — La solution objets trouvés bagages",
  description: "QRBags connecte les voyageurs aux trouveurs d'objets : une étiquette QR sur la valise, un scan du trouveur, une alerte WhatsApp au propriétaire. Née à Dakar, déployée dans 15 pays francophones et au-delà.",
  keywords: ["à propos qrbags", "solution objets trouvés", "startup bagage perdu", "qrbags dakar sénégal"],
  alternates: { canonical: "/a-propos" },
};

export default function AProposLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
