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
  sessionUrl?: string;
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
      success_url: `${getURL('/account')}?payment=success` // Rediriger vers la page account avec indicateur de paiement réussi
    };

    const stripeSession = await stripe.checkout.sessions.create(params);
    return {
      sessionId: stripeSession.id,
      sessionUrl: stripeSession.url || undefined
    };
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
