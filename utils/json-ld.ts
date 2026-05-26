/**
 * JSON-LD structured data utilities for SEO.
 *
 * Generates schema.org-compliant JSON-LD for boat listings (Product type).
 */

interface BoatJsonLdInput {
  id: string;
  model: string;
  price: number;
  currency: string;
  country: string;
  description: string | null;
  photos: string[];
  condition?: string | null;
  specifications?: Record<string, any> | null;
  status?: string | null;
  expiresAt?: Date | string | null;
  createdAt: Date | string;
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
}

export function buildBoatJsonLd(
  boat: BoatJsonLdInput,
  images: string[]
): Record<string, any> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dragonfly-yachts.com';

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: boat.model,
    description: boat.description || `${boat.model} listed on 3Hulls`,
    image: images.length > 0 ? images : undefined,
    sku: boat.id,
    offers: {
      '@type': 'Offer',
      price: boat.price.toString(),
      priceCurrency: boat.currency || 'EUR',
      availability:
        boat.status === 'active'
          ? 'https://schema.org/InStock'
          : 'https://schema.org/SoldOut',
      url: `${baseUrl}/boat/${boat.id}`,
    },
    ...(boat.condition
      ? {
          itemCondition: {
            '@type': 'OfferItemCondition',
            name: boat.condition,
          },
        }
      : {}),
    ...(boat.specifications
      ? {
          additionalProperty: Object.entries(boat.specifications)
            .filter(([, value]) => value != null && value !== '')
            .map(([key, value]) => ({
              '@type': 'PropertyValue',
              name: key,
              value: String(value),
            })),
        }
      : {}),
  };
}
