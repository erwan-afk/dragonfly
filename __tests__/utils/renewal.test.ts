import { describe, expect, it } from 'vitest';
import { computeRenewedExpiry } from '@/utils/boats/renewal';

const now = new Date('2026-10-14T12:00:00Z');

describe('computeRenewedExpiry', () => {
  it('adds 3 months to the current expiry when the listing is still running', () => {
    const result = computeRenewedExpiry(new Date('2026-11-20T00:00:00Z'), now);
    expect(result.toISOString()).toBe('2027-02-20T00:00:00.000Z');
  });

  it('starts from today when the listing already expired', () => {
    const result = computeRenewedExpiry(new Date('2026-08-04T00:00:00Z'), now);
    expect(result.toISOString()).toBe('2027-01-14T12:00:00.000Z');
  });

  it('starts from today when there is no expiry date', () => {
    expect(computeRenewedExpiry(null, now).toISOString()).toBe('2027-01-14T12:00:00.000Z');
    expect(computeRenewedExpiry(undefined, now).toISOString()).toBe('2027-01-14T12:00:00.000Z');
  });

  it('does not mutate the date it is given', () => {
    const current = new Date('2026-11-20T00:00:00Z');
    computeRenewedExpiry(current, now);
    expect(current.toISOString()).toBe('2026-11-20T00:00:00.000Z');
  });
});
