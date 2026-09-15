import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Retrouver une valise perdue — Géolocalisation au scan",
  description: "Comment retrouver une valise perdue à l'aéroport : le QR QRBags transmet la position du scan (aéroport, hôtel, rue) au propriétaire. Localisation précise au moment où le trouveur scanne votre bagage.",
  keywords: ["retrouver valise perdue", "localiser valise", "géolocalisation bagage", "valise perdue aéroport solution", "localisation bagage perdu"],
  alternates: { canonical: "/fonctionnalites/geolocalisation" },
};

export default function GeolocalisationLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
