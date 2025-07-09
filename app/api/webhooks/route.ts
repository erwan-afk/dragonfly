import Stripe from 'stripe';
import { stripe } from '@/utils/stripe/config';
import {
  upsertProductRecord,
  upsertPriceRecord,
  deleteProductRecord,
  deletePriceRecord
} from '@/utils/prisma/admin';
import { handleBoatListingPayment } from '@/utils/prisma/admin'; // Importer la gestion des paiements d'annonces

// Type definition for webhook handlers
type WebhookHandler = (event: Stripe.Event) => Promise<void>;

// Handlers for different webhook events
const webhookHandlers: Record<string, WebhookHandler> = {
  'product.created': async (event) => 
    await upsertProductRecord(event.data.object as Stripe.Product),
  'product.updated': async (event) => 
    await upsertProductRecord(event.data.object as Stripe.Product),
  'product.deleted': async (event) => 
    await deleteProductRecord(event.data.object as Stripe.Product),
  'price.created': async (event) => 
    await upsertPriceRecord(event.data.object as Stripe.Price),
  'price.updated': async (event) => 
    await upsertPriceRecord(event.data.object as Stripe.Price),
  'price.deleted': async (event) => 
    await deletePriceRecord(event.data.object as Stripe.Price),

  // Paiement réussi pour une annonce de bateau
  'checkout.session.completed': async (event) => {
    const checkoutSession = event.data.object as Stripe.Checkout.Session;
    console.log('Session data:', JSON.stringify({
      id: checkoutSession.id,
      mode: checkoutSession.mode,
      customerId: checkoutSession.customer,
      metadata: checkoutSession.metadata
    }));

    if (checkoutSession.mode === 'payment') {
      const customerId = checkoutSession.customer as string;

      try {
        await handleBoatListingPayment(checkoutSession, customerId);
        console.log(`✅ Boat listing payment processed for session: ${checkoutSession.id}`);
      } catch (error) {
        console.error(`❌ Error processing boat listing payment: ${error}`);
      }
    }
  }
};

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    // Valider la signature du webhook
    if (!sig || !webhookSecret) {
      console.error('Missing stripe-signature or STRIPE_WEBHOOK_SECRET');
      return new Response('Configuration error: Missing webhook secret or signature', { 
        status: 500 
      });
    }

    // Construire et valider l'événement Stripe
    const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    console.log(`🔔 Webhook reçu: ${event.type}`);

    // Vérifier si un handler existe pour cet événement
    const handler = webhookHandlers[event.type];
    if (handler) {
      await handler(event);
      return new Response(JSON.stringify({ received: true }));
    }

    console.warn(`⚠️ Événement non géré: ${event.type}`);
    return new Response(`Unhandled event type: ${event.type}`, { 
      status: 400 
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Erreur lors du traitement du webhook: ${errorMessage}`);
    return new Response(`Webhook Error: ${errorMessage}`, { 
      status: 400 
    });
  }
}
