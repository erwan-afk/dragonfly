import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/utils/auth/auth';
import { headers } from 'next/headers';
import { stripe } from '@/utils/stripe/config';
import { createRateLimiter, checkRateLimit } from '@/utils/rate-limit';
import prisma from '@/utils/prisma/client';
import { isValidVideoUrl } from '@/utils/video-embed';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const rateLimiter = createRateLimiter('create_extras_intent', 10, 60);

type AddOn = 'extra_photos' | 'video';

export async function POST(
  req: NextRequest,
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

    const body = await req.json();
    const addOns: AddOn[] = Array.isArray(body?.addOns) ? body.addOns : [];
    const videoUrl: string | undefined = body?.videoUrl;

    if (addOns.length === 0) {
      return NextResponse.json(
        { error: 'No add-ons selected' },
        { status: 400 }
      );
    }

    const wantPhotos = addOns.includes('extra_photos');
    const wantVideo = addOns.includes('video');

    if (wantVideo) {
      if (!videoUrl || !isValidVideoUrl(videoUrl)) {
        return NextResponse.json(
          { error: 'Video URL must be a valid YouTube, Vimeo or Dailymotion link' },
          { status: 400 }
        );
      }
    }

    const boat = await prisma.boat.findFirst({
      where: { id: params.id, userId: user.id },
      select: {
        id: true,
        status: true,
        hasExtraPhotos: true,
        videoUrl: true
      } as any
    }) as any;

    if (!boat) {
      return NextResponse.json(
        { error: 'Boat not found or not owned by you' },
        { status: 404 }
      );
    }

    if (boat.status !== 'active') {
      return NextResponse.json(
        { error: 'Only active listings can purchase add-ons' },
        { status: 400 }
      );
    }

    if (wantPhotos && boat.hasExtraPhotos) {
      return NextResponse.json(
        { error: 'Extra photos pack already purchased' },
        { status: 400 }
      );
    }

    if (wantVideo && boat.videoUrl) {
      return NextResponse.json(
        { error: 'Video pack already purchased' },
        { status: 400 }
      );
    }

    // Find add-on products in local DB (synced from Stripe)
    const products = await prisma.product.findMany({
      where: {
        active: true,
        OR: [
          { name: { contains: 'extra photos', mode: 'insensitive' } },
          { name: { contains: 'video', mode: 'insensitive' } }
        ]
      },
      include: {
        prices: {
          where: { active: true },
          orderBy: { unitAmount: 'asc' },
          take: 1
        }
      }
    });

    const photoProduct = products.find((p) =>
      (p.name || '').toLowerCase().includes('extra')
    );
    const videoProduct = products.find((p) =>
      (p.name || '').toLowerCase().includes('video')
    );

    if (wantPhotos && (!photoProduct || !photoProduct.prices[0])) {
      return NextResponse.json(
        { error: 'Extra photos product is not configured' },
        { status: 500 }
      );
    }
    if (wantVideo && (!videoProduct || !videoProduct.prices[0])) {
      return NextResponse.json(
        { error: 'Video product is not configured' },
        { status: 500 }
      );
    }

    let totalAmount = 0;
    let currency = 'eur';
    const productIds: string[] = [];

    if (wantPhotos) {
      const price = await stripe.prices.retrieve(photoProduct!.prices[0].id);
      if (!price.unit_amount || !price.currency) {
        return NextResponse.json(
          { error: 'Extra photos price misconfigured' },
          { status: 500 }
        );
      }
      totalAmount += price.unit_amount;
      currency = price.currency;
      productIds.push(photoProduct!.id);
    }

    if (wantVideo) {
      const price = await stripe.prices.retrieve(videoProduct!.prices[0].id);
      if (!price.unit_amount || !price.currency) {
        return NextResponse.json(
          { error: 'Video price misconfigured' },
          { status: 500 }
        );
      }
      if (totalAmount > 0 && price.currency !== currency) {
        return NextResponse.json(
          { error: 'Add-on currency mismatch' },
          { status: 500 }
        );
      }
      totalAmount += price.unit_amount;
      currency = price.currency;
      productIds.push(videoProduct!.id);
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        type: 'extras',
        boat_id: boat.id,
        user_id: user.id,
        addons: addOns.join(','),
        video_url: wantVideo ? (videoUrl || '') : '',
        product_id: productIds.join(',')
      }
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: totalAmount,
      currency
    });
  } catch (error) {
    console.error('❌ [extras] error creating PaymentIntent:', error);
    return NextResponse.json(
      { error: 'Failed to create extras payment' },
      { status: 500 }
    );
  }
}
