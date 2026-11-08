import { unstable_cache } from 'next/cache';
import prisma from '@/utils/prisma/client';

/**
 * Number of active, non-expired listings per model key (e.g. { df28: 2 }).
 * Used to decide which "<model> for sale" pages are worth indexing and linking.
 */
export const getActiveModelCounts = unstable_cache(
  async (): Promise<Record<string, number>> => {
    try {
      const rows = (await prisma.$queryRaw`
        SELECT model, COUNT(*)::int AS n
        FROM "boats"
        WHERE status = 'active'
          AND (expires_at IS NULL OR expires_at > NOW())
        GROUP BY model
      `) as { model: string; n: number }[];
      return Object.fromEntries(rows.map((r) => [r.model, Number(r.n)]));
    } catch (error) {
      console.error('Error counting listings by model:', error);
      return {};
    }
  },
  ['active-model-counts'],
  { revalidate: 300, tags: ['boats'] }
);
