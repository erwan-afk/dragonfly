'use client';

import type { ProductWithPrices, StripePrice } from '@/types/database';
import { checkoutWithStripe } from '@/utils/stripe/server';
import { getErrorRedirect } from '@/utils/helpers';
import { UserSimple as User } from '@/types/database';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';

interface Props {
  user: User | null | undefined;
  products: ProductWithPrices[];
}

export default function Pricing({ user, products }: Props) {
  const router = useRouter();
  const [priceIdLoading, setPriceIdLoading] = useState<string>();
  const currentPath = usePathname();

  const handleStripeCheckout = async (
    price: StripePrice,
    product: ProductWithPrices
  ) => {
    setPriceIdLoading(price.id);

    if (!user) {
      setPriceIdLoading(undefined);
      return router.push('/signin/signup');
    }

    // Ajoutez les métadonnées du bateau pour la session Stripe
    const metadata: Record<string, string> = {
      boat_model: product.name || '',
      boat_description: product.description || ''
      // Vous pouvez ajouter d'autres métadonnées nécessaires ici
    };

    const { errorRedirect, sessionUrl } = await checkoutWithStripe(
      price,
      currentPath,
      metadata
    );

    if (errorRedirect) {
      setPriceIdLoading(undefined);
      return router.push(errorRedirect);
    }

    if (!sessionUrl) {
      setPriceIdLoading(undefined);
      return router.push(
        getErrorRedirect(
          currentPath,
          'An unknown error occurred.',
          'Please try again later or contact a system administrator.'
        )
      );
    }

    // Redirect to Stripe Checkout
    window.location.href = sessionUrl;
  };

  if (!products.length) {
    return (
      <section className="bg-black">
        <div className="max-w-6xl px-4 py-8 mx-auto sm:py-24 sm:px-6 lg:px-8">
          <p className="text-4xl font-extrabold text-white sm:text-center sm:text-6xl">
            No one-time pricing plans found. Create them in your{' '}
            <a
              className="text-pink-500 underline"
              href="https://dashboard.stripe.com/products"
              rel="noopener noreferrer"
              target="_blank"
            >
              Stripe Dashboard
            </a>
            .
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-black">
      <div className="max-w-6xl px-4 py-8 mx-auto sm:py-24 sm:px-6 lg:px-8">
        <div className="sm:flex sm:flex-col sm:align-center">
          <h1 className="text-4xl font-extrabold text-white sm:text-center sm:text-6xl">
            One-Time Pricing
          </h1>
          <p className="max-w-2xl m-auto mt-5 text-xl text-zinc-200 sm:text-center sm:text-2xl">
            Choose the option that best suits your needs
          </p>
        </div>
        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 flex flex-wrap justify-center gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0">
          {products.map((product) => {
            const price = product?.prices?.[0];
            if (!price) return null;

            const priceString = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: price.currency || 'eur',
              minimumFractionDigits: 0
            }).format(Number(price?.unitAmount || 0) / 100);

            return (
              <div
                key={product.id}
                className="flex flex-col rounded-lg shadow-sm divide-y divide-zinc-600 bg-zinc-900"
              >
                <div className="p-6">
                  <h2 className="text-2xl font-semibold leading-6 text-white">
                    {product.name}
                  </h2>
                  <p className="mt-4 text-zinc-300">{product.description}</p>
                  <p className="mt-8">
                    <span className="text-5xl font-extrabold white">
                      {priceString}
                    </span>
                  </p>
                  <button
                    type="button"
                    disabled={!!priceIdLoading}
                    onClick={() => handleStripeCheckout(price, product)}
                    className="block w-full py-2 mt-8 text-sm font-semibold text-center text-white rounded-md hover:bg-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {priceIdLoading === price.id ? 'Loading...' : 'Proceed to Checkout'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
