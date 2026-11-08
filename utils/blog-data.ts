/**
 * Blog content. One post goes live per day: a post is only shown once its
 * publishedAt date is reached, so queue new posts with later dates.
 * Paragraphs support inline links with [text](/path) syntax.
 * Price figures are indicative asking prices seen on broker sites in
 * November 2026 — review them before each major update.
 */

import type { BlogCluster, BlogPost } from '@/utils/blog-types';
import { extraPosts } from '@/content/blog';

export type { BlogPost, BlogSection, BlogCluster } from '@/utils/blog-types';

export const blogPosts: BlogPost[] = extraPosts;

/** Posts whose publishedAt date (UTC) has been reached. */
export function getPublishedPosts(now: Date = new Date()): BlogPost[] {
  const today = now.toISOString().slice(0, 10);
  return blogPosts.filter((p) => p.publishedAt <= today);
}

export function getBlogPost(slug: string): BlogPost | null {
  return getPublishedPosts().find((p) => p.slug === slug) ?? null;
}

/** The pillar article of each topic cluster. */
export const CLUSTER_PILLARS: Record<BlogCluster, string> = {
  prices: 'dragonfly-trimaran-price-guide',
  models: 'what-is-a-dragonfly-trimaran',
  buying: 'how-to-buy-a-boat',
  selling: 'how-to-sell-your-boat',
  education: 'types-of-boats',
  transport: 'sailboat-transport-guide'
};

export const CLUSTER_LABELS: Record<BlogCluster, string> = {
  prices: 'Prices',
  models: 'Models',
  buying: 'Buying',
  selling: 'Selling',
  education: 'Boat knowledge',
  transport: 'Transport & storage'
};

/**
 * Published posts of the same cluster to show under an article.
 * A pillar lists all its published satellites; a satellite lists its pillar
 * first, then up to 3 siblings. Computed from the registry, never hand-edited.
 */
export function getRelatedPosts(post: BlogPost, now: Date = new Date()): BlogPost[] {
  const pillarSlug = CLUSTER_PILLARS[post.cluster];
  const same = getPublishedPosts(now).filter(
    (p) => p.cluster === post.cluster && p.slug !== post.slug
  );
  if (post.slug === pillarSlug) {
    return same.sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));
  }
  const pillar = same.find((p) => p.slug === pillarSlug);
  const siblings = same
    .filter((p) => p.slug !== pillarSlug)
    .sort((a, b) => a.publishedAt.localeCompare(b.publishedAt))
    .slice(0, 3);
  return pillar ? [pillar, ...siblings] : siblings;
}
