import { Suspense } from 'react';
import PricingSection from '@/components/ui/Pricing/PricingSection';
import BoatGrid from '@/components/BoatGrid';
import ReloadButton from '@/components/ReloadButton';
import {
  getProductsFromDatabase,
  getBoatsFromDatabase
} from '@/utils/database/products';
import HeroSection from '@/components/HeroSection';
import FeatureSection from '@/components/FeatureSection';
import Button from '@/components/ui/Button/Button';
import { Skeleton } from '@heroui/skeleton';

export default async function HomePage() {
  console.log('🏠 HomePage: Fetching data...');

  try {
    // Récupérer les produits et bateaux depuis la BDD
    const [products, boats] = await Promise.all([
      getProductsFromDatabase(),
      getBoatsFromDatabase(3) // Limite à 3 bateaux les plus récents pour la homepage
    ]);

    console.log('✅ HomePage: Data fetched successfully');
    console.log('📊 Products:', products.length, 'Boats:', boats.length);

    return (
      <div className="min-h-screen">
        <HeroSection />

        <Suspense
          fallback={
            <div className="p-8 text-center">Chargement des bateaux...</div>
          }
        >
          <BoatGrid boats={boats} />
        </Suspense>

        <FeatureSection />

        <Suspense
          fallback={
            <div className="p-8 text-center">Chargement des tarifs...</div>
          }
        >
          <PricingSection
            products={products}
            user={null}
            userSubscription={null}
          />
        </Suspense>

        <section className="w-full py-[128px] bg-gradient-to-t from-oceanblue to-articblue ">
          <div className="mx-auto max-w-screen-xl flex flex-col gap-[80px] items-center ">
            <div className="flex flex-col items-center gap-[40px] max-w-[860px]">
              <h1 className="text-48">Latest forum discussions</h1>
              <p className="text-center">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi
                consectetur quis enim ut volutpat. In massa nulla, blandit sit
                amet semper eget, accumsan eget nisl. In facilisis felis nulla.
                Morbi consectetur quis enim ut volutpat.
              </p>
              <div className="flex flex-row gap-24">
                <Button
                  text="Add a topic"
                  icon="link"
                  bgColor="bg-fullwhite"
                  iconColor="text-oceanblue"
                  href="/forum"
                />
                <Button
                  text="Discover forum"
                  icon="link"
                  bgColor="bg-oceanblue"
                  iconColor="text-fullwhite"
                  href="/forum"
                />
              </div>
            </div>
            <div></div>
          </div>
        </section>
      </div>
    );
  } catch (error) {
    console.error('❌ HomePage: Error loading data:', error);

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
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
