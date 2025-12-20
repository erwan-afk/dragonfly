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

        // Récupérer le produit acheté depuis les line_items
        let productId: string | null = null;
        if (checkoutSession.line_items?.data && checkoutSession.line_items.data.length > 0) {
            const firstItem = checkoutSession.line_items.data[0];
            if (firstItem.price && typeof firstItem.price.product === 'string') {
                productId = firstItem.price.product;
            }
        }

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
                productId,
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

// Fonction pour déterminer le plan actuel d'un bateau basé sur son productId
export async function getCurrentBoatPlan(boatId: string): Promise<string> {
    try {
        // Récupérer le boat avec son produit
        const boat = await prisma.boat.findUnique({
            where: { id: boatId },
            include: {
                product: true
            }
        });

        if (!boat) {
            return 'start line'; // Plan par défaut si boat non trouvé
        }

        // Si le boat a un produit associé, utiliser son nom
        if (boat.product?.name) {
            return boat.product.name.toLowerCase();
        }

        // Sinon, récupérer depuis les paiements (fallback pour compatibilité)
        const payments = await prisma.payment.findMany({
            where: {
                boatId,
                status: 'completed'
            },
            include: {
                product: true
            },
            orderBy: { createdAt: 'desc' }
        });

        if (payments.length === 0) {
            return 'start line'; // Plan par défaut
        }

        // Hiérarchie des plans (du plus bas au plus élevé)
        const planHierarchy = ['start line', 'mid-course', 'podium', 'renewal'];

        // Trouver le plan le plus élevé acheté
        let highestPlanIndex = -1;

        for (const payment of payments) {
            if (payment.product?.name) {
                const planName = payment.product.name.toLowerCase();
                const planIndex = planHierarchy.findIndex(plan =>
                    planName.includes(plan) ||
                    plan.includes(planName)
                );

                if (planIndex > highestPlanIndex) {
                    highestPlanIndex = planIndex;
                }
            }
        }

        // Retourner le plan le plus élevé trouvé, ou 'start line' par défaut
        return highestPlanIndex >= 0 ? planHierarchy[highestPlanIndex] : 'start line';

    } catch (error) {
        console.error(`❌ Error determining plan for boat ${boatId}:`, error);
        return 'start line'; // Plan par défaut en cas d'erreur
    }
} 