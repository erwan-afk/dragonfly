'use server';

import Stripe from 'stripe';
import { stripe } from '@/utils/stripe/config';
import { auth } from '@/utils/auth/auth';
import { headers } from 'next/headers';
import { createOrRetrieveCustomer } from '@/utils/prisma/admin';
import {
  getURL,
  getErrorRedirect,
  calculateTrialEndUnixTimestamp
} from '@/utils/helpers';
import { StripePrice as Price } from '@/types/database';

type CheckoutResponse = {
  errorRedirect?: string;
  sessionId?: string;
};

export async function checkoutWithStripe(
  price: Price,
  redirectPath: string = '/account',
  metadata: Record<string, string> = {}
): Promise<CheckoutResponse> {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      throw new Error('Could not get user session.');
    }

    const user = session.user;

    const customer = await createOrRetrieveCustomer({
      uuid: user.id || '',
      email: user.email || ''
    });

    const params: Stripe.Checkout.SessionCreateParams = {
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer,
      customer_update: {
        address: 'auto'
      },
      line_items: [
        {
          price: price.id,
          quantity: 1
        }
      ],
      mode: 'payment',
      metadata: {
        user_id: user.id,
        ...metadata
      },
      cancel_url: getURL(),
      success_url: getURL('/payment-success') // Rediriger vers notre page custom
    };

    const stripeSession = await stripe.checkout.sessions.create(params);
    return { sessionId: stripeSession.id };

  } catch (error) {
    if (error instanceof Error) {
      return {
        errorRedirect: getErrorRedirect(
          redirectPath,
          error.message,
          'Please try again later or contact a system administrator.'
        )
      };
    }
    return {
      errorRedirect: getErrorRedirect(
        redirectPath,
        'An unknown error occurred.',
        'Please try again later or contact a system administrator.'
      )
    };
  }
}

export async function createStripePortal(currentPath: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      throw new Error('Could not get user session.');
    }

    const user = session.user;

    let customer;
    try {
      customer = await createOrRetrieveCustomer({
        uuid: user.id || '',
        email: user.email || ''
      });
    } catch (err) {
      console.error(err);
      throw new Error('Unable to access customer record.');
    }

    if (!customer) {
      throw new Error('Could not get customer.');
    }

    try {
      const { url } = await stripe.billingPortal.sessions.create({
        customer,
        return_url: getURL('/account')
      });
      if (!url) {
        throw new Error('Could not create billing portal');
      }
      return url;
    } catch (err) {
      console.error(err);
      throw new Error('Could not create billing portal');
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
      return getErrorRedirect(
        currentPath,
        error.message,
        'Please try again later or contact a system administrator.'
      );
    } else {
      return getErrorRedirect(
        currentPath,
        'An unknown error occurred.',
        'Please try again later or contact a system administrator.'
      );
    }
  }
}

// Nouvelle fonction pour récupérer les produits depuis Stripe
export async function getActiveProductsFromStripe() {
  try {
    console.log('🔍 Fetching products from Stripe...');

    // Récupérer tous les produits actifs depuis Stripe
    const products = await stripe.products.list({
      active: true,
      expand: ['data.default_price']
    });

    // Pour chaque produit, récupérer tous ses prix
    const productsWithPrices = await Promise.all(
      products.data.map(async (product) => {
        const prices = await stripe.prices.list({
          product: product.id,
          active: true
        });

        return {
          id: product.id,
          name: product.name,
          description: product.description,
          active: product.active,
          image: product.images?.[0] || null,
          metadata: product.metadata,
          prices: prices.data.map(price => ({
            id: price.id,
            product_id: typeof price.product === 'string' ? price.product : price.product?.id || null,
            active: price.active,
            description: price.nickname,
            unit_amount: price.unit_amount,
            currency: price.currency,
            type: price.type === 'one_time' ? 'one_time' : 'recurring',
            interval: price.recurring?.interval || null,
            interval_count: price.recurring?.interval_count || null,
            trial_period_days: price.recurring?.trial_period_days || null,
            metadata: price.metadata
          }))
        };
      })
    );

    console.log('✅ Products fetched from Stripe successfully');
    console.log('📊 Products found:', productsWithPrices.length);

    return productsWithPrices;
  } catch (error) {
    console.error('❌ Error fetching products from Stripe:', error);
    throw error;
  }
}
