import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checklist voyage — Liste de bagages gratuite",
  description: "Checklist de voyage gratuite : préparez vos bagages sans rien oublier (documents, valise cabine, soute, électronique). Créez votre liste personnalisée et partagez-la. Ne laissez plus jamais un bagage derrière vous.",
  keywords: ["checklist voyage", "liste bagages", "que emporter en voyage", "checklist valise", "préparation voyage", "liste de course voyage"],
  alternates: { canonical: "/checklist" },
};

export default function ChecklistLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
