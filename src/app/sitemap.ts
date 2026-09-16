import type { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';

/* ══════════════════════════════════════════════════════════════
   Sitemap dynamique QRBags — https://qrbags.com/sitemap.xml
   • Toutes les pages publiques (marketing, fonctionnalités, étapes)
   • Pages agences publiques /agency/{slug} (SEO local partenaires)
   • force-dynamic → aucune requête DB exécutée au build Docker ;
     si la DB est indisponible, on retombe sur les routes statiques.
   ══════════════════════════════════════════════════════════════ */

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://qrbags.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    // Pages principales
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/commander`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/inscrire`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/hajj-omra`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/voyageurs-standard`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/devenir-partenaire`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/checklist`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/demo`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },

    // Fonctionnalités
    { url: `${BASE_URL}/fonctionnalites/sans-application`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/fonctionnalites/sans-batterie`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/fonctionnalites/alertes-whatsapp`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/fonctionnalites/geolocalisation`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/fonctionnalites/securite-rgpd`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },

    // Comment ça marche (étapes)
    { url: `${BASE_URL}/etapes/recevez-votre-qr`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/etapes/activez-30-secondes`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/etapes/soyez-notifie`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/etapes/voyagez-serein`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },

    // Institutionnel
    { url: `${BASE_URL}/a-propos`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/cgu`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/confidentialite`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/mentions-legales`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  // Pages agences publiques — SEO local (partenaires QRBags)
  try {
    const agencies = await prisma.agency.findMany({
      where: { active: true },
      select: { slug: true },
      take: 500,
    });
    const agencyRoutes: MetadataRoute.Sitemap = agencies.map((a) => ({
      url: `${BASE_URL}/agency/${a.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));
    return [...staticRoutes, ...agencyRoutes];
  } catch {
    // DB indisponible (ex. build) — sitemap statique valide uniquement
    return staticRoutes;
  }
}
