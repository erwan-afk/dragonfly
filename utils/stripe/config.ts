import Stripe from 'stripe';

function getStripeSecretKey() {
  const liveKey = process.env.STRIPE_SECRET_KEY_LIVE;
  const anyKey = process.env.STRIPE_SECRET_KEY;
  const key = liveKey ?? anyKey ?? '';

  // Warn loudly if production is accidentally using a test key.
  // (This commonly happens when STRIPE_SECRET_KEY_LIVE is missing.)
  if (process.env.NODE_ENV === 'production' && key.startsWith('sk_test_')) {
    console.error(
      '❌ Stripe is configured with a TEST secret key in production. Set STRIPE_SECRET_KEY_LIVE to your live key.'
    );
  }

  return key;
}

export const stripe = new Stripe(getStripeSecretKey(), {
  // https://github.com/stripe/stripe-node#configuration
  // https://stripe.com/docs/api/versioning
  // @ts-ignore
  apiVersion: null,
  // Register this as an official Stripe plugin.
  // https://stripe.com/docs/building-plugins#setappinfo
  appInfo: {
    name: 'Next.js Subscription Starter',
    version: '0.0.0',
    url: 'https://github.com/vercel/nextjs-subscription-payments'
  }
});
