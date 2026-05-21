// Number/currency formatting helpers that pick a locale based on the currency.
// EUR/CHF use European thousands separators; USD/GBP/CAD/AUD keep the comma.

const CURRENCY_LOCALES: Record<string, string> = {
  EUR: 'fr-FR',
  USD: 'en-US',
  GBP: 'en-GB',
  CHF: 'de-CH',
  CAD: 'en-CA',
  AUD: 'en-AU',
};

export function getLocaleForCurrency(currency?: string | null): string {
  return CURRENCY_LOCALES[(currency ?? 'EUR').toUpperCase()] || 'fr-FR';
}

export function formatPriceNumber(
  amount: number,
  currency?: string | null
): string {
  return new Intl.NumberFormat(getLocaleForCurrency(currency), {
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPriceCurrency(
  amount: number,
  currency: string = 'EUR',
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(getLocaleForCurrency(currency), {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  }).format(amount);
}
