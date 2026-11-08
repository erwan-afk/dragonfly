export interface BlogSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export type BlogCluster =
  | 'prices'
  | 'models'
  | 'buying'
  | 'selling'
  | 'education'
  | 'transport';

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  /** The ONE query this page owns. Must be unique across the blog (checked by scripts/check-blog.ts). */
  primaryKeyword: string;
  cluster: BlogCluster;
  /** Secondary phrases this page may mention. Never another post's primaryKeyword. */
  keywords: string[];
  publishedAt: string; // ISO date, post is hidden until this date (UTC)
  updatedAt: string; // ISO date
  readingMinutes: number;
  intro: string;
  sections: BlogSection[];
}
