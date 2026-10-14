/** Number of months a paid renewal adds to a listing. */
export const RENEWAL_MONTHS = 3;

/**
 * New expiry date after a paid renewal.
 *
 * - still running listing: the 3 months are added to its current expiry, so
 *   renewing early never loses the time already paid for;
 * - expired listing (or no expiry): the 3 months start today.
 */
export function computeRenewedExpiry(
  currentExpiresAt: Date | null | undefined,
  now: Date = new Date()
): Date {
  const base =
    currentExpiresAt && currentExpiresAt.getTime() > now.getTime()
      ? new Date(currentExpiresAt)
      : new Date(now);
  base.setUTCMonth(base.getUTCMonth() + RENEWAL_MONTHS);
  return base;
}
