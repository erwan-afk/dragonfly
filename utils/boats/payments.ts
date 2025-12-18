import prisma from '@/utils/prisma/client';
import type Stripe from 'stripe';

export async function createBoatPaymentRecord(
    checkoutSession: Stripe.Checkout.Session,
    boatId: string,
    userId: string
): Promise<{ success: boolean; paymentId?: string; error?: string }> {
    try {
        const stripeSessionId = checkoutSession.id;
        console.log(`💳 Creating payment record for boat ${boatId}...`, {
            stripeSessionId,
            userId
        });

        // Extraire les informations du paiement
        const amount = (checkoutSession.amount_total || 0) / 100; // Stripe utilise les centimes
        const status = checkoutSession.payment_status === 'paid' ? 'completed' : 'pending';

        // Idempotence: Stripe peut renvoyer le webhook (retries).
        // On évite de créer 2 enregistrements pour le même PaymentIntent/Session.
        const existing = await prisma.payment.findFirst({
            where: {
                stripeSessionId,
                boatId
            },
            select: { id: true }
        });

        if (existing) {
            console.log(`ℹ️ Payment record already exists, skipping create`, {
                paymentId: existing.id,
                boatId,
                stripeSessionId
            });
            return { success: true, paymentId: existing.id };
        }

        // Créer l'enregistrement de paiement
        const payment = await prisma.payment.create({
            data: {
                userId,
                boatId,
                amount,
                status,
                stripeSessionId,
                createdAt: new Date()
            }
        });

        console.log(`✅ Payment record created with ID: ${payment.id} for boat: ${boatId}`, {
            stripeSessionId,
            status,
            amount
        });

        return {
            success: true,
            paymentId: payment.id
        };

    } catch (error) {
        console.error(`❌ Error creating payment record for boat ${boatId}:`, error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

export async function getBoatPayments(boatId: string) {
    try {
        const payments = await prisma.payment.findMany({
            where: { boatId },
            orderBy: { createdAt: 'desc' }
        });

        return {
            success: true,
            payments
        };
    } catch (error) {
        console.error(`❌ Error fetching payments for boat ${boatId}:`, error);
        return {
            success: false,
            payments: [],
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
} 