import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/utils/stripe/config';
import { auth } from '@/utils/auth/auth';
import { headers } from 'next/headers';
import { createRateLimiter, checkRateLimit } from '@/utils/rate-limit';

export const dynamic = 'force-dynamic';

const rateLimiter = createRateLimiter('create_payment_intent', 10, 60);

export async function POST(req: NextRequest) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY_LIVE ?? process.env.STRIPE_SECRET_KEY ?? '';
    if (!stripeKey) {
      console.error('❌ [create-payment-intent] STRIPE_SECRET_KEY(_LIVE) is missing');
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      );
    }

    const session = await auth.api.getSession({ headers: await headers() });
    const user = session?.user;

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Rate limiting per user
    const rateLimitResponse = await checkRateLimit(rateLimiter, user.id);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    const { priceId, metadata, currentPriceId } = body;

    if (!priceId) {
      return NextResponse.json(
        { error: 'Missing required field: priceId' },
        { status: 400 }
      );
    }

    // Server-side price lookup — never trust client-provided amount
    let price;
    try {
      price = await stripe.prices.retrieve(priceId);
    } catch {
      return NextResponse.json(
        { error: 'Invalid price ID' },
        { status: 400 }
      );
    }

    if (!price.unit_amount || !price.currency) {
      return NextResponse.json(
        { error: 'Price has no amount configured' },
        { status: 400 }
      );
    }

    // For upgrades: calculate the price difference (new - current)
    let finalAmount = price.unit_amount;
    if (currentPriceId) {
      try {
        const currentPrice = await stripe.prices.retrieve(currentPriceId);
        if (currentPrice.unit_amount && currentPrice.currency === price.currency) {
          finalAmount = Math.max(0, price.unit_amount - currentPrice.unit_amount);
        }
      } catch {
        // Could not retrieve current price, charging full amount
      }
    }

    // Whitelist allowed metadata keys
    const allowedMetadataKeys = ['listing_type', 'user_id', 'boat_id', 'product_id'];
    const safeMetadata: Record<string, string> = {};
    if (metadata) {
      for (const key of allowedMetadataKeys) {
        if (metadata[key]) safeMetadata[key] = String(metadata[key]);
      }
    }

    // Create PaymentIntent with server-verified amount
    const paymentIntent = await stripe.paymentIntents.create({
      amount: finalAmount,
      currency: price.currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: user.id,
        priceId,
        ...safeMetadata
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    const maybeStripeError = error as any;
    const code: string | undefined =
      maybeStripeError?.code ?? maybeStripeError?.raw?.code;

    console.error('❌ [create-payment-intent] error:', {
      code,
      type: maybeStripeError?.type ?? maybeStripeError?.rawType,
      message: maybeStripeError?.message,
    });

    if (code === 'api_key_expired') {
      return NextResponse.json(
        { error: 'Stripe API key expired' },
        { status: 401 }
      );
    }

    if (code === 'invalid_api_key' || code === 'invalid_request_error') {
      return NextResponse.json(
        { error: 'Stripe authentication failed' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
