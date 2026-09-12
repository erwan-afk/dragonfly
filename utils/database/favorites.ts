import prisma from '@/utils/prisma/client';

/** Bulk-fetch which of the given boat ids the user has favorited, in one query. */
export async function getFavoritedBoatIds(userId: string | null, boatIds: string[]): Promise<string[]> {
  if (!userId || boatIds.length === 0) return [];
  const rows = await prisma.favorite.findMany({
    where: { userId, boatId: { in: boatIds } },
    select: { boatId: true }
  });
  return rows.map((r) => r.boatId);
}
