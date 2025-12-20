import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/utils/stripe/config';
import { auth } from '@/utils/auth/auth';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Guardrails: in production we prefer explicit env config (instead of failing deep inside Stripe SDK).
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

    const body = await req.json();
    const { amount, currency, priceId, metadata } = body;

    console.log('💳 [create-payment-intent] request', {
      userId: user.id,
      amount,
      currency,
      priceId,
      metadataKeys: metadata ? Object.keys(metadata) : []
    });

    if (amount == null || !currency || !priceId) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, currency, priceId' },
        { status: 400 }
      );
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Créer le PaymentIntent avec Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(parsedAmount), // Amount in cents
      currency: currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: user.id,
        priceId,
        ...metadata
      },
    });

    console.log('✅ [create-payment-intent] PaymentIntent created:', paymentIntent.id);

    console.log('✅ [create-payment-intent] created', {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    // Stripe errors are structured; return a clearer status without leaking secrets.
    const maybeStripeError = error as any;
    const code: string | undefined =
      maybeStripeError?.code ?? maybeStripeError?.raw?.code;

    console.error('❌ [create-payment-intent] error:', {
      code,
      type: maybeStripeError?.type ?? maybeStripeError?.rawType,
      message: maybeStripeError?.message,
      statusCode: maybeStripeError?.statusCode ?? maybeStripeError?.raw?.statusCode,
    });

    if (code === 'api_key_expired') {
      return NextResponse.json(
        { error: 'Stripe API key expired', code },
        { status: 401 }
      );
    }

    if (code === 'invalid_api_key' || code === 'invalid_request_error') {
      return NextResponse.json(
        { error: 'Stripe authentication failed', code },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create payment intent', code },
      { status: 500 }
    );
  }
}

