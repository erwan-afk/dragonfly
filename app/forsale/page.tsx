import type { Metadata } from 'next';
import { ForSaleData } from './forsale-data';
import { getURL } from '@/utils/helpers';

// Désactiver le rendu statique - cette page doit être rendue dynamiquement
export const dynamic = 'force-dynamic';

interface ForSaleSearchParams {
  model?: string;
  country?: string;
  minPrice?: string;
  maxPrice?: string;
  attributes?: string;
  sort?: string;
}

interface ForSalePageProps {
  searchParams: Promise<ForSaleSearchParams>;
}

export async function generateMetadata({
  searchParams
}: ForSalePageProps): Promise<Metadata> {
  const params = await searchParams;
  const hasFilters = Boolean(
    params.model ||
      params.country ||
      params.minPrice ||
      params.maxPrice ||
      params.attributes ||
      params.sort
  );

  return {
    title: 'Dragonfly Trimarans for Sale | Browse Used Boats',
    description:
      'Browse used Dragonfly trimarans for sale. Filter current listings by model, price, location and equipment, then contact the seller directly.',
    alternates: { canonical: getURL('/forsale') },
    robots: hasFilters
      ? { index: false, follow: true }
      : { index: true, follow: true }
  };
}

export default async function ForSalePage({ searchParams }: ForSalePageProps) {
  return <ForSaleData searchParams={searchParams} />;
}
