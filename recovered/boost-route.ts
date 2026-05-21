import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/utils/auth/auth';
import { headers } from 'next/headers';
import { stripe } from '@/utils/stripe/config';
import { createRateLimiter, checkRateLimit } from '@/utils/rate-limit';
import prisma from '@/utils/prisma/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const rateLimiter = createRateLimiter('create_boost_intent', 10, 60);

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const stripeKey =
      process.env.STRIPE_SECRET_KEY_LIVE ?? process.env.STRIPE_SECRET_KEY ?? '';
    if (!stripeKey) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      );
    }

    const session = await auth.api.getSession({ headers: await headers() });
    const user = session?.user;
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimitResponse = await checkRateLimit(rateLimiter, user.id);
    if (rateLimitResponse) return rateLimitResponse;

    const boat = await prisma.boat.findFirst({
      where: { id: params.id, userId: user.id },
      select: {
        id: true,
        status: true,
        boostExpiresAt: true
      }
    });

    if (!boat) {
      return NextResponse.json(
        { error: 'Boat not found or not owned by you' },
        { status: 404 }
      );
    }

    if (boat.status !== 'active') {
      return NextResponse.json(
        { error: 'Only active listings can be boosted' },
        { status: 400 }
      );
    }

    if (boat.boostExpiresAt && boat.boostExpiresAt.getTime() > Date.now()) {
      return NextResponse.json(
        { error: 'This listing already has an active boost' },
        { status: 400 }
      );
    }

    // Find boost product+price from local DB (synced from Stripe).
    const boostProduct = await prisma.product.findFirst({
      where: {
        active: true,
        name: { contains: 'boost', mode: 'insensitive' }
      },
      include: {
        prices: {
          where: { active: true },
          orderBy: { unitAmount: 'asc' },
          take: 1
        }
      }
    });

    const boostPriceId = boostProduct?.prices[0]?.id;
    if (!boostProduct || !boostPriceId) {
      return NextResponse.json(
        { error: 'Boost product is not configured' },
        { status: 500 }
      );
    }

    let price;
    try {
      price = await stripe.prices.retrieve(boostPriceId);
    } catch {
      return NextResponse.json(
        { error: 'Boost price not found in Stripe' },
        { status: 500 }
      );
    }

    if (!price.unit_amount || !price.currency) {
      return NextResponse.json(
        { error: 'Boost price has no amount configured' },
        { status: 500 }
      );
    }

    const productId =
      typeof price.product === 'string' ? price.product : price.product?.id;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: price.unit_amount,
      currency: price.currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        type: 'boost',
        boat_id: boat.id,
        user_id: user.id,
        priceId: boostPriceId,
        product_id: productId ?? ''
      }
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: price.unit_amount,
      currency: price.currency
    });
  } catch (error) {
    console.error('❌ [boost] error creating PaymentIntent:', error);
    return NextResponse.json(
      { error: 'Failed to create boost payment' },
      { status: 500 }
    );
  }
}
