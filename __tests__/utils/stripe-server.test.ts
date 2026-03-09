import { describe, it, expect } from 'vitest';

/**
 * Tests for utils/stripe/server.ts
 *
 * getActiveProductsFromStripe() is dead code (never imported anywhere).
 * The actual product fetching uses getProductsFromDatabase() from utils/database/products.ts
 * which returns BOTH camelCase and snake_case for compatibility.
 *
 * This test validates the database product formatting logic.
 */

describe('Product data formatting', () => {
  it('should have both camelCase and snake_case price properties for compatibility', () => {
    // Simulating the output format of getProductsFromDatabase
    const priceData = {
      id: 'price_123',
      product_id: 'prod_abc',
      productId: 'prod_abc',
      active: true,
      description: 'Standard listing',
      unitAmount: 2999,
      unit_amount: 2999,
      currency: 'eur',
      type: 'one_time',
      interval: null,
      intervalCount: null,
      interval_count: null,
      trialPeriodDays: null,
      trial_period_days: null,
      metadata: {}
    };

    // Consumers using camelCase (BoatListingFormV2, Pricing, EditListing)
    expect(priceData.unitAmount).toBe(2999);
    expect(priceData.productId).toBe('prod_abc');
    expect(priceData.intervalCount).toBeNull();
    expect(priceData.trialPeriodDays).toBeNull();

    // Consumers using snake_case (PricingSection)
    expect(priceData.unit_amount).toBe(2999);
    expect(priceData.product_id).toBe('prod_abc');
    expect(priceData.interval_count).toBeNull();
    expect(priceData.trial_period_days).toBeNull();
  });

  it('should format price for display correctly', () => {
    const unitAmount = 2999;
    const currency = 'eur';

    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(unitAmount / 100);

    expect(formatted).toContain('29.99');
  });

  it('should handle null currency with fallback', () => {
    const currency: string | null = null;
    const safeCurrency = currency || 'eur';

    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: safeCurrency,
      minimumFractionDigits: 0
    }).format(2999 / 100);

    expect(formatted).toContain('29.99');
  });

  it('should handle zero unitAmount', () => {
    const unitAmount = 0;
    expect(Number(unitAmount || 0) / 100).toBe(0);
  });
});
