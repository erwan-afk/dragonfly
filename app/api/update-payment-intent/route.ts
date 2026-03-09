import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/utils/stripe/config';
import { auth } from '@/utils/auth/auth';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

// Only these metadata keys can be set/updated by the client
const ALLOWED_METADATA_KEYS = ['boat_id', 'listing_type', 'user_id', 'product_id'];

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
    const { paymentIntentId, metadata } = body;

    if (!paymentIntentId || !metadata) {
      return NextResponse.json(
        { error: 'Missing required fields: paymentIntentId, metadata' },
        { status: 400 }
      );
    }

    // Verify the PaymentIntent belongs to the authenticated user
    const existing = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (existing.metadata?.userId && existing.metadata.userId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Whitelist metadata keys to prevent arbitrary injection
    const safeMetadata: Record<string, string> = { userId: user.id };
    for (const key of ALLOWED_METADATA_KEYS) {
      if (metadata[key]) safeMetadata[key] = String(metadata[key]);
    }

    const paymentIntent = await stripe.paymentIntents.update(
      paymentIntentId,
      { metadata: safeMetadata }
    );

    console.log('✅ [update-payment-intent] updated', {
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status
    });

    return NextResponse.json({
      success: true,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error('❌ [update-payment-intent] error:', error);
    return NextResponse.json(
      { error: 'Failed to update payment intent' },
      { status: 500 }
    );
  }
}
