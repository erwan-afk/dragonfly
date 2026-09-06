import { Suspense } from 'react';
import PricingSection from '@/components/ui/Pricing/PricingSection';
import BoatGrid from '@/components/BoatGrid';
import ReloadButton from '@/components/ReloadButton';
import ForumSection from '@/components/ForumSection';
import {
  getProductsFromDatabase,
  getBoatsFromDatabase
} from '@/utils/database/products';
import { getFavoritedBoatIds } from '@/utils/database/favorites';
import { auth } from '@/utils/auth/auth';
import { headers } from 'next/headers';
import HeroSection from '@/components/HeroSection';
import FeatureSection from '@/components/FeatureSection';
import Button from '@/components/ui/Button/Button';
import { Skeleton } from '@heroui/skeleton';
import { getURL } from '@/utils/helpers';

// Désactiver le rendu statique - cette page doit être rendue dynamiquement
export const dynamic = 'force-dynamic';

export const metadata = {
  // The title template from the root layout does not apply to app/page.tsx
  // (same route segment as the layout that defines it), so the full title
  // is spelled out here rather than relying on the "%s | 3Hulls" template.
  title: 'Dragonfly Trimarans for Sale | 3Hulls',
  description:
    'Buy and sell used Dragonfly trimarans. Browse current listings, compare Dragonfly models and place your boat advertisement on 3Hulls.',
  alternates: { canonical: getURL('/') }
};

export default async function HomePage() {
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) console.log('🏠 HomePage: Fetching data...');

  try {
    // Récupérer les produits et bateaux depuis la BDD
    const [products, boats] = await Promise.all([
      getProductsFromDatabase(),
      getBoatsFromDatabase(3) // Limite à 3 bateaux les plus récents pour la homepage
    ]);

    const session = await auth.api.getSession({ headers: await headers() });
    const viewerUserId = session?.user?.id ?? null;
    const favoritedBoatIds = await getFavoritedBoatIds(
      viewerUserId,
      boats.map((b: any) => b.id)
    );

    return (
      <div className="min-h-screen">
        <HeroSection />

        <Suspense
          fallback={
            <div className="p-8 text-center">Chargement des bateaux...</div>
          }
        >
          <BoatGrid boats={boats} favoritedBoatIds={favoritedBoatIds} isAuthenticated={!!viewerUserId} />
        </Suspense>

        <FeatureSection />

        <PricingSection
          products={products}
          user={null}
          userSubscription={null}
        />

        <Suspense
          fallback={
            <div className="p-8 text-center">Chargement du forum...</div>
          }
        >
          <ForumSection />
        </Suspense>
      </div>
    );
  } catch (error) {
    console.error('❌ HomePage: Error loading data:', error);

    return (
      <div className="min-h-screen bg-fullwhite">
        <HeroSection />
        <FeatureSection />

        <section className="py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-8 text-gray-800">
              Erreur de chargement
            </h2>
            <p className="text-gray-600 mb-8">
              Une erreur s'est produite lors du chargement des données.
            </p>
            <ReloadButton />
          </div>
        </section>
      </div>
    );
  }
}
