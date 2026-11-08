/**
 * Blog content. One post goes live per day: a post is only shown once its
 * publishedAt date is reached, so queue new posts with later dates.
 * Paragraphs support inline links with [text](/path) syntax.
 * Price figures are indicative asking prices seen on broker sites in
 * November 2026 — review them before each major update.
 */

import type { BlogPost } from '@/utils/blog-types';
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
