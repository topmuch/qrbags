import { MetadataRoute } from 'next';
import { db } from '@/lib/db';

const BASE_URL = 'https://qrbag.com';

// Static public pages
const staticPages: MetadataRoute.Sitemap = [
  {
    url: BASE_URL,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 1.0,
  },
  {
    url: `${BASE_URL}/a-propos`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.8,
  },
  {
    url: `${BASE_URL}/contact`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.8,
  },
  {
    url: `${BASE_URL}/devenir-partenaire`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.8,
  },
  {
    url: `${BASE_URL}/hajj-omra`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.8,
  },
  {
    url: `${BASE_URL}/voyageurs-standard`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  },
  {
    url: `${BASE_URL}/cgu`,
    lastModified: new Date(),
    changeFrequency: 'yearly',
    priority: 0.3,
  },
  {
    url: `${BASE_URL}/confidentialite`,
    lastModified: new Date(),
    changeFrequency: 'yearly',
    priority: 0.3,
  },
  {
    url: `${BASE_URL}/mentions-legales`,
    lastModified: new Date(),
    changeFrequency: 'yearly',
    priority: 0.3,
  },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch dynamic agency pages from database
  let agencyPages: MetadataRoute.Sitemap = [];

  try {
    const agencies = await db.agency.findMany({
      select: {
        slug: true,
        updatedAt: true,
      },
      where: {
        slug: { not: null },
      },
    });

    agencyPages = agencies.map((agency) => ({
      url: `${BASE_URL}/agency/${agency.slug}`,
      lastModified: agency.updatedAt || new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error('Error generating agency sitemap entries:', error);
  }

  return [...staticPages, ...agencyPages];
}
