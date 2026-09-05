/**
 * JSON-LD structured data utilities for SEO.
 *
 * Generates schema.org-compliant JSON-LD for boat listings (Product type)
 * and BreadcrumbList navigation trails.
 */

import { getURL } from '@/utils/helpers';

interface BoatJsonLdInput {
  id: string;
  modelLabel: string;
  year?: number | null;
  price: number;
  currency: string;
  description: string | null;
  status?: string | null;
  createdAt: Date | string;
}

function getAvailability(status: string | null | undefined): string {
  if (status === 'sold') return 'https://schema.org/SoldOut';
  if (status === 'active') return 'https://schema.org/InStock';
  // pending / inactive / deleted: not currently purchasable, but not
  // confirmed sold either.
  return 'https://schema.org/OutOfStock';
}

export function buildBoatJsonLd(
  boat: BoatJsonLdInput,
  images: string[]
): Record<string, any> {
  const url = getURL(`/boat/${boat.id}`);
  const name = boat.year ? `${boat.modelLabel} ${boat.year}` : boat.modelLabel;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description: boat.description || `${name} listed on 3Hulls`,
    image: images.length > 0 ? images : undefined,
    sku: boat.id,
    url,
    offers: {
      '@type': 'Offer',
      url,
      price: boat.price.toString(),
      priceCurrency: boat.currency || 'EUR',
      availability: getAvailability(boat.status),
      // All listings on 3Hulls are pre-owned boats — schema.org has no
      // finer-grained "used" condition than UsedCondition.
      itemCondition: 'https://schema.org/UsedCondition'
    }
  };
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

export function buildBreadcrumbJsonLd(
  items: BreadcrumbItem[]
): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}
