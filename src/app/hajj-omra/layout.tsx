import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Étiquette bagage Hajj & Omra — Protection valise pèlerin",
  description: "Étiquette QR pour bagages Hajj et Omra : protégez les valises des pèlerins à La Mecque, Médine, Djeddah. Si un bagage est perdu ou trouvé, un scan du QR alerte immédiatement le pèlerin sur WhatsApp. 3 bagages inclus par pack.",
  keywords: ["étiquette bagage hajj", "bagage hajj perdu", "valise omra", "bagage pèlerin", "QR bagage La Mecque", "valise perdue djeddah", "protection bagage pèlerinage"],
  alternates: { canonical: "/hajj-omra" },
};

export default function HajjOmraLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
