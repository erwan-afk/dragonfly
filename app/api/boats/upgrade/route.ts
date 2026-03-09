import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/utils/auth/auth';
import { headers } from 'next/headers';
import prisma from '@/utils/prisma/client';
import { stripe } from '@/utils/stripe/config';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { boatId, newPlan, paymentIntentId } = body;

        // Validation
        if (!boatId || !newPlan) {
            return NextResponse.json(
                { error: 'Missing boatId or newPlan' },
                { status: 400 }
            );
        }

        if (!paymentIntentId) {
            return NextResponse.json(
                { error: 'Payment verification required' },
                { status: 402 }
            );
        }

        // Verify payment with Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (paymentIntent.status !== 'succeeded') {
            return NextResponse.json(
                { error: 'Payment not completed' },
                { status: 402 }
            );
        }

        // Validate that newPlan is a real product in the database
        const product = await prisma.product.findUnique({
            where: { id: newPlan }
        });
        if (!product) {
            return NextResponse.json(
                { error: 'Invalid plan' },
                { status: 400 }
            );
        }

        // Vérifier que le bateau appartient à l'utilisateur
        const existingBoat = await prisma.boat.findFirst({
            where: {
                id: boatId,
                userId: session.user.id
            }
        });

        if (!existingBoat) {
            return NextResponse.json({ error: 'Boat not found or unauthorized' }, { status: 404 });
        }

        // Mettre à jour le productId du bateau avec le nouveau plan
        await prisma.boat.update({
            where: { id: boatId },
            data: { productId: newPlan }
        });

        console.log('✅ Boat upgrade processed:', existingBoat.id, 'New productId:', newPlan);

        return NextResponse.json({
            success: true,
            message: 'Boat upgrade processed successfully'
        });

    } catch (error) {
        console.error('❌ Error processing boat upgrade:', error);
        return NextResponse.json(
            { error: 'Failed to process boat upgrade' },
            { status: 500 }
        );
    }
}
