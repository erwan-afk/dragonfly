import type { MetadataRoute } from 'next';
import prisma from '@/utils/prisma/client';
import { getURL } from '@/utils/helpers';
import { modelsData } from '@/utils/models-data';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Regenerate at most once per hour

const STATIC_ROUTES: { path: string; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']; priority: number }[] = [
  { path: '/', changeFrequency: 'daily', priority: 1.0 },
  { path: '/forsale', changeFrequency: 'hourly', priority: 0.9 },
  { path: '/models', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/pricing', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/contact', changeFrequency: 'yearly', priority: 0.5 },
  { path: '/useful-links', changeFrequency: 'monthly', priority: 0.4 },
  { path: '/forum', changeFrequency: 'daily', priority: 0.6 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/policies', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/legal-notice', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/sales-terms', changeFrequency: 'yearly', priority: 0.2 }
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getURL().replace(/\/$/, '');
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${baseUrl}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority
  }));

  // Model detail pages
  const modelEntries: MetadataRoute.Sitemap = Object.keys(modelsData).map(
    (slug) => ({
      url: `${baseUrl}/models/${slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.7
    })
  );

  // Active boat listings
  let boatEntries: MetadataRoute.Sitemap = [];
  try {
    const boats = await prisma.boat.findMany({
      where: {
        status: 'active',
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }]
      },
      select: {
        id: true,
        updatedAt: true,
        boostExpiresAt: true
      },
      orderBy: { updatedAt: 'desc' },
      take: 10000
    });

    boatEntries = boats.map((b) => {
      const boosted =
        b.boostExpiresAt && b.boostExpiresAt.getTime() > now.getTime();
      return {
        url: `${baseUrl}/boat/${b.id}`,
        lastModified: b.updatedAt ?? now,
        changeFrequency: 'weekly' as const,
        priority: boosted ? 0.9 : 0.6
      };
    });
  } catch (error) {
    console.error('[sitemap] failed to load boats:', error);
  }

  return [...staticEntries, ...modelEntries, ...boatEntries];
}
