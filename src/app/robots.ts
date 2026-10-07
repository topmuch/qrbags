import type { MetadataRoute } from "next";

// SEO : robots dynamique — autorise l'indexation des pages publiques
// (dont /suivi/, /passeport/, /scan/ et /agency/{slug}), bloque les zones
// privées (API, back-offices admin/agence/dashboard, pages utilitaires)
// et déclare le sitemap. Correction GSC « Bloquée par le fichier robots.txt ».
// L'URL de production peut être surchargée via NEXT_PUBLIC_BASE_URL.
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://qrbags.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin",
          "/agence/",
          "/dashboard/",
          "/login",
          "/verify-email",
          "/reset-password",
          "/forgot-password",
          "/expired",
          "/offline",
          "/success",
          "/hajj/activate",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
