import { Suspense } from 'react';
import PricingSection from '@/components/ui/Pricing/PricingSection';
import { getProductsFromDatabase } from '@/utils/database/products';
import Button from '@/components/ui/Button';
import {
  PRICING_COMPARISON_DATA,
  getProductFeatures,
  type ProductName
} from '@/lib/product-features';

// Désactiver le rendu statique - cette page doit être rendue dynamiquement
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Pricing - 3Hulls',
  description:
    'View our pricing plans for advertising your trimaran. Choose the best package that suits your needs and budget.'
};

export default async function PricingPage() {
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) console.log('💰 PricingPage: Fetching products...');

  try {
    // Récupérer les produits depuis la BDD
    const products = await getProductsFromDatabase();

    return (
      <div className="min-h-screen py-16 gap-32 lg:gap-64 flex flex-col">
        <div className="flex flex-col md:flex-row gap-16 lg:gap-0 justify-between items-start md:items-center w-full max-w-screen-xl mx-auto px-16 xl:px-0">
          <h1 className="text-oceanblue text-32 lg:text-56">Advertising Plans</h1>
          <p className="text-darkgrey w-full md:w-1/2 text-16 font-light">
            Choose the perfect plan to showcase your Dragonfly trimaran. Our
            flexible advertising options ensure maximum visibility and help you
            reach potential buyers effectively.
          </p>
        </div>

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

        {/* Tableau comparatif des fonctionnalités */}
        <section className="mx-auto max-w-screen-xl w-full my-32 lg:my-64 px-16 xl:px-0">
          <h2 className="text-24 lg:text-32 text-articblue text-center mb-12">
            Compare Features
          </h2>

          <div className="border-1 border-stonegrey/20 rounded-16 w-full overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse bg-fullwhite rounded-16 overflow-hidden shadow-sm">
              {/* En-tête */}
              <thead>
                <tr className="bg-gradient-to-r from-articblue to-oceanblue">
                  <th className="text-left p-6 text-fullwhite font-medium text-18">
                    Features
                  </th>
                  <th className="text-center p-6 text-fullwhite font-medium text-18 border-l border-fullwhite/20">
                    Start line
                  </th>
                  <th className="text-center p-6 text-fullwhite font-medium text-18 border-l border-fullwhite/20 bg-oceanblue/30">
                    <div className="flex flex-col items-center gap-1">
                      <span>Mid-course</span>
                    </div>
                  </th>
                  <th className="text-center p-6 text-fullwhite font-medium text-18 border-l border-fullwhite/20">
                    Podium
                  </th>
                  <th className="text-center p-6 text-fullwhite font-medium text-18 border-l border-fullwhite/20">
                    Renewal
                  </th>
                </tr>
              </thead>

              {/* Corps du tableau */}
              <tbody>
                {/* Ligne 1: Price Range */}
                <tr className="border-t-2 border-stonegrey/30 hover:bg-lightgrey/50  transition-colors">
                  <td className="p-6 text-oceanblue font-medium">
                    Boat Price Range
                  </td>
                  {PRICING_COMPARISON_DATA.products.map(
                    (productName, index) => {
                      const isMidCourse = productName === 'mid-course';
                      return (
                        <td
                          key={productName}
                          className={`text-center p-6 text-oceanblue border-l border-stonegrey/20 ${
                            isMidCourse ? 'bg-articblue/5' : ''
                          }`}
                        >
                          {
                            PRICING_COMPARISON_DATA.features.priceRange[
                              productName
                            ]
                          }
                        </td>
                      );
                    }
                  )}
                </tr>

                {/* Ligne 2: Photos */}
                <tr className="border-t border-stonegrey/20 hover:bg-lightgrey/50 transition-colors">
                  <td className="p-6 text-oceanblue font-medium">
                    Number of Photos
                  </td>
                  {PRICING_COMPARISON_DATA.products.map(
                    (productName, index) => {
                      const isMidCourse = productName === 'mid-course';
                      const photoCount =
                        PRICING_COMPARISON_DATA.features.photos[productName];
                      return (
                        <td
                          key={productName}
                          className={`text-center p-6 text-oceanblue border-l border-stonegrey/20 ${
                            isMidCourse ? 'bg-articblue/5' : ''
                          }`}
                        >
                          {photoCount !== null ? (
                            <span className="inline-flex items-center justify-center w-10 h-10 border-1 border-stonegrey/20 text-articblue rounded-full font-bold bg-fullwhite">
                              {photoCount}
                            </span>
                          ) : (
                            <span className="text-stonegrey">—</span>
                          )}
                        </td>
                      );
                    }
                  )}
                </tr>

                {/* Ligne 3: Duration */}
                <tr className="border-t border-stonegrey/20 hover:bg-lightgrey/50 transition-colors">
                  <td className="p-6 text-oceanblue font-medium">
                    Listing Duration
                  </td>
                  {PRICING_COMPARISON_DATA.products.map(
                    (productName, index) => {
                      const isMidCourse = productName === 'mid-course';
                      return (
                        <td
                          key={productName}
                          className={`text-center p-6 text-oceanblue border-l border-stonegrey/20 ${
                            isMidCourse ? 'bg-articblue/5' : ''
                          }`}
                        >
                          {
                            PRICING_COMPARISON_DATA.features.duration[
                              productName
                            ]
                          }
                        </td>
                      );
                    }
                  )}
                </tr>

                {/* Ligne 4: Homepage Featured */}
                <tr className="border-t border-stonegrey/20 hover:bg-lightgrey/50 transition-colors">
                  <td className="p-6 text-oceanblue font-medium">
                    Homepage Featured Placement
                  </td>
                  {PRICING_COMPARISON_DATA.products.map(
                    (productName, index) => {
                      const isMidCourse = productName === 'mid-course';
                      const features = getProductFeatures(productName);
                      return (
                        <td
                          key={productName}
                          className={`text-center p-6 border-l border-stonegrey/20 ${
                            isMidCourse ? 'bg-articblue/5' : ''
                          }`}
                        >
                          {features.homepageFeatured ? (
                            <span className="text-24 font-bold text-articblue">
                              ✓
                            </span>
                          ) : productName === 'renewal' ? (
                            <span className="text-stonegrey">—</span>
                          ) : (
                            <span className="text-24 text-stonegrey">✗</span>
                          )}
                        </td>
                      );
                    }
                  )}
                </tr>

                {/* Ligne 5: Search Priority */}
                <tr className="border-t border-stonegrey/20 hover:bg-lightgrey/50 transition-colors">
                  <td className="p-6 text-oceanblue font-medium">
                    Search Results Priority
                  </td>
                  {PRICING_COMPARISON_DATA.products.map(
                    (productName, index) => {
                      const isMidCourse = productName === 'mid-course';
                      const priority =
                        PRICING_COMPARISON_DATA.features.searchPriority[
                          productName
                        ];
                      return (
                        <td
                          key={productName}
                          className={`text-center p-6 border-l border-stonegrey/20 ${
                            isMidCourse ? 'bg-articblue/5' : ''
                          } ${priority === 'High Priority' ? 'text-articblue font-medium' : 'text-oceanblue'}`}
                        >
                          {priority}
                        </td>
                      );
                    }
                  )}
                </tr>

                {/* Ligne 6: Edit Anytime */}
                <tr className="border-t border-stonegrey/20 hover:bg-lightgrey/50 transition-colors">
                  <td className="p-6 text-oceanblue font-medium">
                    Edit Listing Anytime
                  </td>
                  {PRICING_COMPARISON_DATA.products.map(
                    (productName, index) => {
                      const isMidCourse = productName === 'mid-course';
                      const features = getProductFeatures(productName);
                      return (
                        <td
                          key={productName}
                          className={`text-center p-6 text-articblue border-l border-stonegrey/20 ${
                            isMidCourse ? 'bg-articblue/5' : ''
                          }`}
                        >
                          {features.editAnytime && (
                            <span className="text-24 font-bold">✓</span>
                          )}
                        </td>
                      );
                    }
                  )}
                </tr>

                {/* Ligne 7: Email Support */}
                <tr className="border-t border-stonegrey/20 hover:bg-lightgrey/50 transition-colors">
                  <td className="p-6 text-oceanblue font-medium">
                    Email Notifications
                  </td>
                  {PRICING_COMPARISON_DATA.products.map(
                    (productName, index) => {
                      const isMidCourse = productName === 'mid-course';
                      const features = getProductFeatures(productName);
                      return (
                        <td
                          key={productName}
                          className={`text-center p-6 text-articblue border-l border-stonegrey/20 ${
                            isMidCourse ? 'bg-articblue/5' : ''
                          }`}
                        >
                          {features.emailNotifications && (
                            <span className="text-24 font-bold">✓</span>
                          )}
                        </td>
                      );
                    }
                  )}
                </tr>

                {/* Ligne 8: cta */}
                <tr className="border-t border-stonegrey/20 transition-colors">
                  <td className="p-6 text-oceanblue font-medium"></td>
                  <td className="text-center p-6 text-articblue border-l border-stonegrey/20">
                    <Button
                      text="Start with Start line"
                      href="/pricing"
                      bgColor="bg-articblue"
                      textColor="text-fullwhite"
                      icon="link"
                      textsize="text-[12px]"
                    />
                  </td>
                  <td className="text-center p-6 text-articblue border-l border-stonegrey/20 bg-articblue/5 ">
                    <Button
                      text="Start with Mid-course"
                      href="/pricing"
                      bgColor="bg-oceanblue"
                      textColor="text-fullwhite"
                      icon="link"
                      textsize="text-[12px]"
                    />
                  </td>
                  <td className="text-center p-6 text-articblue border-l border-stonegrey/20">
                    <Button
                      text="Start with Podium"
                      href="/pricing"
                      bgColor="bg-articblue"
                      textColor="text-fullwhite"
                      icon="link"
                      textsize="text-[12px]"
                    />
                  </td>
                  <td className="text-center p-6 text-articblue border-l border-stonegrey/20">
                    <Button
                      text="Start with Renewal"
                      href="/pricing"
                      bgColor="bg-articblue"
                      textColor="text-fullwhite"
                      icon="link"
                      textsize="text-[12px]"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Légende */}
          <div className="mt-32 text-center text-darkgrey text-[12px]">
            <div className="flex flex-row justify-center items-center gap-8">
              <svg
                width="13"
                height="13"
                viewBox="0 0 13 13"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="0.3"
                  y="0.3"
                  width="12.4"
                  height="12.3531"
                  rx="6.17656"
                  fill="none"
                />
                <rect
                  x="0.3"
                  y="0.3"
                  width="12.4"
                  height="12.3531"
                  rx="6.17656"
                  stroke="black"
                  strokeWidth="0.6"
                />
                <path
                  d="M6.7432 10H6.0432V4.73H6.7432V10ZM6.9532 3.51C6.9532 3.66333 6.89987 3.79 6.7932 3.89C6.6932 3.99 6.55654 4.04 6.3832 4.04C6.2232 4.04 6.08987 3.99 5.9832 3.89C5.87654 3.79 5.8232 3.66333 5.8232 3.51C5.8232 3.35667 5.87654 3.23333 5.9832 3.14C6.08987 3.04 6.2232 2.99 6.3832 2.99C6.55654 2.99 6.6932 3.04 6.7932 3.14C6.89987 3.23333 6.9532 3.35667 6.9532 3.51Z"
                  fill="black"
                />
              </svg>
              All plans include full listing management, contact form, and
              exposure to our global community of Dragonfly enthusiasts.
            </div>
          </div>
        </section>
      </div>
    );
  } catch (error) {
    console.error('❌ PricingPage: Error loading products:', error);

    return (
      <div className="min-h-screen py-16">
        <div className="mx-auto max-w-screen-xl px-4 text-center">
          <h1 className="text-48 text-articblue mb-8">Pricing</h1>
          <p className="text-18 text-oceanblue mb-8">
            Une erreur s'est produite lors du chargement des tarifs.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-articblue text-fullwhite px-8 py-3 rounded-full font-medium hover:bg-oceanblue transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }
}
