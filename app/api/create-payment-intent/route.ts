import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/utils/stripe/config';
import { auth } from '@/utils/auth/auth';
import { headers } from 'next/headers';
import { createRateLimiter, checkRateLimit } from '@/utils/rate-limit';
import prisma from '@/utils/prisma/client';

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
    const { priceId, metadata, currentPriceId, addOnPriceIds } = body;

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

    // Add-ons: only allow priceIds belonging to whitelisted products (extra photos / video).
    // Source of truth = local DB (synced from Stripe).
    const addonNames: string[] = [];
    if (Array.isArray(addOnPriceIds) && addOnPriceIds.length > 0) {
      const validAddOnProducts = await prisma.product.findMany({
        where: {
          active: true,
          OR: [
            { name: { contains: 'extra photos', mode: 'insensitive' } },
            { name: { contains: 'video', mode: 'insensitive' } }
          ]
        },
        include: {
          prices: { where: { active: true }, select: { id: true } }
        }
      });
      const allowedPriceMap = new Map<string, string>(); // priceId -> productName
      for (const p of validAddOnProducts) {
        for (const pr of p.prices) {
          allowedPriceMap.set(pr.id, (p.name || '').toLowerCase());
        }
      }

      for (const addOnId of addOnPriceIds as string[]) {
        if (!allowedPriceMap.has(addOnId)) {
          return NextResponse.json(
            { error: `Invalid add-on price: ${addOnId}` },
            { status: 400 }
          );
        }
        let addOnPrice;
        try {
          addOnPrice = await stripe.prices.retrieve(addOnId);
        } catch {
          return NextResponse.json(
            { error: 'Invalid add-on price ID' },
            { status: 400 }
          );
        }
        if (!addOnPrice.unit_amount || addOnPrice.currency !== price.currency) {
          return NextResponse.json(
            { error: 'Add-on currency mismatch' },
            { status: 400 }
          );
        }
        finalAmount += addOnPrice.unit_amount;
        const name = allowedPriceMap.get(addOnId) || '';
        if (name.includes('extra')) addonNames.push('extra_photos');
        else if (name.includes('video')) addonNames.push('video');
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
    if (addonNames.length > 0) {
      safeMetadata.addons = Array.from(new Set(addonNames)).join(',');
    }

    // Verify boat ownership if boat_id is provided
    if (safeMetadata.boat_id) {
      const boat = await prisma.boat.findFirst({
        where: { id: safeMetadata.boat_id, userId: user.id }
      });
      if (!boat) {
        return NextResponse.json(
          { error: 'Boat not found or not owned by you' },
          { status: 403 }
        );
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
