import { ForSaleData } from './forsale-data';

// Désactiver le rendu statique - cette page doit être rendue dynamiquement
export const dynamic = 'force-dynamic';

interface ForSalePageProps {
  searchParams: Promise<{
    model?: string;
    country?: string;
    minPrice?: string;
    maxPrice?: string;
    attributes?: string;
    sort?: string;
  }>;
}

export default async function ForSalePage({ searchParams }: ForSalePageProps) {
  return <ForSaleData searchParams={searchParams} />;
}
