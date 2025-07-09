import { PricingCard } from '@/components/ui/PrincingCard/PrincingCard';

interface PricingSectionProps {
  products: any[];
  user: any;
  userSubscription: any;
}

export default function PricingSection({
  products,
  user,
  userSubscription
}: PricingSectionProps) {
  return (
    <section className="w-full py-[128px] bg-lightgrey ">
      <div className="mx-auto max-w-screen-xl flex flex-col gap-[80px]">
        <div className="flex flex-row justify-between">
          <h1 className="text-oceanblue text-56">How it works ?</h1>
          <p className="text-darkgrey w-1/2 text-16 font-light">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi
            consectetur quis enim ut volutpat.
          </p>
        </div>

        <div className="flex flex-row gap-16 justify-center">
          {products.map((product, index) => {
            const featuresList = [
              [
                'Boats up to €30,000',
                'Includes 3 photos',
                'Duration of 3 months'
              ],
              [
                'Boats over €30,000',
                'Includes 5 photos',
                'Duration of 3 months'
              ],
              [
                'All boats',
                'Includes 10 photos',
                'Duration of 4 months',
                'Regular prominence on the home page'
              ],
              ['Advertisement extended for a further 3 months']
            ];

            const price = product?.prices?.[0];
            const popular = index === 1; // Produit à l'index 1 (le deuxième) est "popular"
            const renewal = index === 3;

            if (!price) return null;

            return (
              <PricingCard
                key={product.id}
                title={product.name ?? 'No title'}
                price={`${Number(price.unit_amount ?? 0) / 100} ${price.currency?.toUpperCase() ?? ''}`}
                buttonText={renewal ? 'Upgrade an ad' : 'Place an ad'}
                features={
                  featuresList[index] || [
                    'Custom package',
                    'Flexible options available'
                  ]
                }
                stripePrice={price}
                stripeProduct={product}
                popular={popular}
                renewal={renewal}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
