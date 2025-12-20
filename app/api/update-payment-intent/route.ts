import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/utils/stripe/config';
import { auth } from '@/utils/auth/auth';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export const dynamic = 'force-dynamic';

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

    console.log('🧾 [update-payment-intent] request', {
      userId: user.id,
      paymentIntentId,
      metadataKeys: metadata ? Object.keys(metadata) : []
    });

    if (!paymentIntentId || !metadata) {
      return NextResponse.json(
        { error: 'Missing required fields: paymentIntentId, metadata' },
        { status: 400 }
      );
    }

    // Mettre à jour le PaymentIntent avec les métadonnées
    const paymentIntent = await stripe.paymentIntents.update(
      paymentIntentId,
      {
        metadata: {
          userId: user.id,
          ...metadata
        }
      }
    );

    console.log('✅ [update-payment-intent] updated', {
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      metadataKeys: paymentIntent.metadata ? Object.keys(paymentIntent.metadata) : []
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
