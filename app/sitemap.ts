import type { MetadataRoute } from 'next';
import prisma from '@/utils/prisma/client';
import { getURL } from '@/utils/helpers';
import { modelsData } from '@/utils/models-data';
import { getPublishedPosts } from '@/utils/blog-data';
import { getActiveModelCounts } from '@/utils/database/model-counts';
import { modelSlug } from '@/utils/forsale-models';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Regenerate at most once per hour

const STATIC_ROUTES: { path: string; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']; priority: number }[] = [
  { path: '/', changeFrequency: 'daily', priority: 1.0 },
  { path: '/forsale', changeFrequency: 'hourly', priority: 0.9 },
  { path: '/models', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/blog', changeFrequency: 'weekly', priority: 0.7 },
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

  // lastModified is only declared when it is known. Stamping every page with
  // "now" teaches Google to ignore the field, so pages without a real date
  // simply omit it.
  const publishedPosts = getPublishedPosts();
  const latestPost = publishedPosts.reduce<Date | undefined>((acc, p) => {
    const d = new Date(p.publishedAt);
    return !acc || d > acc ? d : acc;
  }, undefined);

  // Model detail pages
  const modelEntries: MetadataRoute.Sitemap = Object.keys(modelsData).map(
    (slug) => ({
      url: `${baseUrl}/models/${slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.7
    })
  );

  const blogEntries: MetadataRoute.Sitemap = publishedPosts.map((p) => ({
    url: `${baseUrl}/blog/${p.slug}`,
    lastModified: new Date(p.publishedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.7
  }));

  // Active boat listings
  let boatEntries: MetadataRoute.Sitemap = [];
  let latestBoatUpdate: Date | undefined;
  let forSaleModelEntries: MetadataRoute.Sitemap = [];
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

    latestBoatUpdate = boats[0]?.updatedAt ?? undefined;

    // "<model> for sale" pages are only listed while the model has a live listing.
    const counts = await getActiveModelCounts();
    forSaleModelEntries = Object.keys(modelsData)
      .filter((key) => (counts[key] ?? 0) > 0)
      .map((key) => ({
        url: `${baseUrl}/forsale/${modelSlug(key)}`,
        changeFrequency: 'daily' as const,
        priority: 0.8
      }));

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

  const staticDates: Record<string, Date | undefined> = {
    '/forsale': latestBoatUpdate,
    '/blog': latestPost
  };
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${baseUrl}${r.path}`,
    ...(staticDates[r.path] ? { lastModified: staticDates[r.path] } : {}),
    changeFrequency: r.changeFrequency,
    priority: r.priority
  }));

  return [
    ...staticEntries,
    ...modelEntries,
    ...forSaleModelEntries,
    ...blogEntries,
    ...boatEntries
  ];
}
