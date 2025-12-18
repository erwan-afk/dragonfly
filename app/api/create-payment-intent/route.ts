import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/utils/stripe/config';
import { auth } from '@/utils/auth/auth';
import { headers } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
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

    if (!amount || !currency || !priceId) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, currency, priceId' },
        { status: 400 }
      );
    }

    // Créer le PaymentIntent avec Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Amount in cents
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
    console.error('❌ [create-payment-intent] error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}

