import Stripe from 'stripe';
import { stripe } from '@/utils/stripe/config';
import {
  upsertProductRecord,
  upsertPriceRecord,
  deleteProductRecord,
  deletePriceRecord
} from '@/utils/prisma/admin';
import { handleBoatListingPayment } from '@/utils/prisma/admin'; // Importer la gestion des paiements d'annonces
import { activateBoat, emergencyCleanup } from '@/utils/boats/status';
import { createBoatPaymentRecord } from '@/utils/boats/payments';
import { moveTempImagesToBoat, urlToKey } from '@/utils/cloudflare/r2';
import prisma from '@/utils/prisma/client';
import { revalidateTag } from 'next/cache';
import { getProductFeatures } from '@/lib/product-features';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
      const boatId = checkoutSession.metadata?.boat_id;

      try {
        if (boatId) {
          // Nouveau système : Activer le bateau existant ET créer l'enregistrement de paiement
          console.log(`🔍 Processing payment for boat ${boatId} with customer ${customerId}`);

          // 1. Récupérer l'utilisateur à partir du customer Stripe
          const customer = await prisma.customer.findFirst({
            where: { stripeCustomerId: customerId }
          });

          if (!customer) {
            throw new Error(`Customer lookup failed: No customer found with Stripe ID: ${customerId}`);
          }

          const userId = customer.id;
          console.log(`✅ Customer found with ID: ${userId}`);

          // 2. Créer l'enregistrement de paiement (le bateau est déjà actif)
          const paymentResult = await createBoatPaymentRecord(checkoutSession, boatId, userId);

          if (paymentResult.success) {
            console.log(`✅ Payment recorded with ID: ${paymentResult.paymentId}`);

            // 3. Mettre à jour le productId du boat avec le produit acheté
            if (checkoutSession.line_items?.data && checkoutSession.line_items.data.length > 0) {
              const firstItem = checkoutSession.line_items.data[0];
              if (firstItem.price && typeof firstItem.price.product === 'string') {
                const productId = firstItem.price.product;
                try {
                  await prisma.boat.update({
                    where: { id: boatId },
                    data: { productId }
                  });
                  console.log(`✅ Boat ${boatId} productId updated to: ${productId}`);
                } catch (error) {
                  console.error(`❌ Failed to update boat productId: ${error}`);
                }
              }
            }
          } else {
            console.error(`❌ Failed to record payment: ${paymentResult.error}`);
          }

          // 5. Déplacer les images du dossier temporaire vers le dossier final
          try {
            console.log(`🖼️ Moving temporary images to final location for boat ${boatId}...`);

            // Récupérer le bateau pour obtenir ses images
            const boat = await prisma.boat.findUnique({
              where: { id: boatId },
              select: { photos: true }
            });

            if (boat && boat.photos && boat.photos.length > 0) {
              // Extraire les clés temporaires des URLs d'images
              const tempKeys: string[] = [];

              for (const photoUrl of boat.photos) {
                // Si l'URL est déjà une clé R2 directe (pas une URL HTTP)
                let key = photoUrl;

                // Si c'est une URL HTTP complète, extraire la clé
                if (photoUrl.startsWith('http')) {
                  key = urlToKey(photoUrl as string) || '';
                } else {
                  // Supprimer le préfixe de domaine s'il existe
                  if (photoUrl.startsWith('dragonfly-trimarans.org/')) {
                    key = photoUrl.replace('dragonfly-trimarans.org/', '');
                  }
                }

                if (key && key.includes('temp_session_')) {
                  tempKeys.push(key);
                }
              }

              if (tempKeys.length > 0) {
                console.log(`📦 Found ${tempKeys.length} temporary images to move:`, tempKeys);

                const moveResult = await moveTempImagesToBoat(tempKeys, boatId);

                if (moveResult.success && moveResult.finalUrls.length > 0) {
                  // Mettre à jour la base de données avec les nouvelles URLs
                  await prisma.boat.update({
                    where: { id: boatId },
                    data: { photos: moveResult.finalUrls }
                  });

                  console.log(`✅ Successfully moved ${moveResult.finalUrls.length} images to final location`);
                  console.log(`📍 New image URLs:`, moveResult.finalUrls);
                } else {
                  console.error(`❌ Failed to move images: ${moveResult.error}`);
                }
              } else {
                console.log(`ℹ️ No temporary images found to move for boat ${boatId}`);
              }
            }
          } catch (error) {
            console.error(`❌ Error moving images for boat ${boatId}:`, error);
          }

          console.log(`✅ Boat payment processed completely for session: ${checkoutSession.id}`);
        } else {
          // Ancien système : Créer un nouveau bateau (utilisé pour les paiements sans boat_id)
          await handleBoatListingPayment(checkoutSession, customerId);
          console.log(`✅ Boat listing payment processed (legacy) for session: ${checkoutSession.id}`);
        }
      } catch (error) {
        console.error(`❌ Error processing boat listing payment: ${error}`);
      }
    }
  },

  // Session expirée - supprimer le bateau pending
  'checkout.session.expired': async (event) => {
    const checkoutSession = event.data.object as Stripe.Checkout.Session;
    const boatId = checkoutSession.metadata?.boat_id;

    if (boatId) {
      try {
        await emergencyCleanup(boatId, 'Stripe session expired');
      } catch (error) {
        console.error(`❌ Error cleaning up boat after session expired: ${error}`);
      }
    }
  },

  // Paiement échoué - supprimer le bateau pending
  'payment_intent.payment_failed': async (event) => {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    // Récupérer la session checkout associée
    const sessions = await stripe.checkout.sessions.list({
      payment_intent: paymentIntent.id,
      limit: 1
    });

    if (sessions.data.length > 0) {
      const session = sessions.data[0];
      const boatId = session.metadata?.boat_id;

      if (boatId) {
        try {
          await emergencyCleanup(boatId, 'Stripe payment failed');
        } catch (error) {
          console.error(`❌ Error cleaning up boat after payment failed: ${error}`);
        }
      }
    }

    // Gérer aussi les PaymentIntents créés via Payment Element (sans checkout session)
    const boatId = paymentIntent.metadata?.boat_id;
    if (boatId) {
      try {
        await emergencyCleanup(boatId, 'Stripe payment failed');
      } catch (error) {
        console.error(`❌ Error cleaning up boat after payment failed: ${error}`);
      }
    }
  },

  // Paiement réussi via Payment Element
  'payment_intent.succeeded': async (event) => {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const boatId = paymentIntent.metadata?.boat_id;
    const userId = paymentIntent.metadata?.user_id;

    console.log(
      '🔔 Payment Intent succeeded',
      JSON.stringify({
        paymentIntentId: paymentIntent.id,
        boatId,
        userId,
        listingType: paymentIntent.metadata?.listing_type,
        productId: paymentIntent.metadata?.product_id
      })
    );

    if (!boatId) {
      console.log(`ℹ️ No boat_id in metadata, skipping`);
      return;
    }

    try {
      console.log(`🔍 Processing payment for boat ${boatId}`, {
        eventId: event.id,
        paymentIntentId: paymentIntent.id
      });

      // 1. Vérifier que le bateau existe et est en statut pending
      const boat = await prisma.boat.findUnique({
        where: { id: boatId },
        select: { id: true, status: true, photos: true, userId: true }
      });

      if (!boat) {
        throw new Error(`Boat ${boatId} not found`);
      }

      console.log(`📦 Boat state before processing`, {
        boatId: boat.id,
        status: boat.status,
        ownerUserId: boat.userId
      });

      if (boat.status !== 'pending') {
        console.log(`⚠️ Boat ${boatId} is already ${boat.status}, skipping`);
        return;
      }

      // 2. Calculer la date d'expiration (par défaut 3 mois)
      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setMonth(expiresAt.getMonth() + 3); // Par défaut 3 mois

      console.log(`📅 Calculated expiration date: ${expiresAt.toISOString()} (${Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} days)`);

      // 3. Activer le bateau avec la date d'expiration
      console.log(`✅ Activating boat ${boatId}...`);
      await prisma.boat.update({
        where: { id: boatId },
        data: {
          status: 'active',
          expiresAt: expiresAt
        }
      });
      console.log(`✅ Boat activated with expiration date`, { boatId, expiresAt: expiresAt.toISOString() });

      // 3. Créer l'enregistrement de paiement
      const customerId = paymentIntent.customer as string | null;
      
      // Créer un objet similaire à Checkout.Session pour la compatibilité
      const pseudoSession: any = {
        id: paymentIntent.id,
        payment_intent: paymentIntent.id,
        customer: customerId,
        amount_total: paymentIntent.amount,
        currency: paymentIntent.currency,
        payment_status: 'paid',
        metadata: paymentIntent.metadata
      };

      const paymentUserId = userId || boat.userId;
      const paymentResult = await createBoatPaymentRecord(pseudoSession, boatId, paymentUserId);

      if (paymentResult.success) {
        console.log(`✅ Payment recorded with ID: ${paymentResult.paymentId}`);

        // 4. Mettre à jour le productId du boat avec le produit acheté (pour les autres cas)
        const productId = paymentIntent.metadata?.product_id;
        if (productId && boatId) {
          try {
            await prisma.boat.update({
              where: { id: boatId },
              data: { productId: productId }
            });
            console.log(`✅ Boat ${boatId} productId updated to: ${productId} (webhook)`);
          } catch (error) {
            console.error(`❌ Failed to update boat productId via webhook: ${error}`);
          }
        }
      } else {
        console.error(`❌ Failed to record payment: ${paymentResult.error}`);
      }

      // 5. Déplacer les images du dossier temporaire vers le dossier final
      try {
        console.log(`🖼️ Moving temporary images to final location for boat ${boatId}...`);

        if (boat.photos && boat.photos.length > 0) {
          const tempKeys: string[] = [];

          for (const photoUrl of boat.photos) {
            let key = photoUrl;

            if (photoUrl.startsWith('http')) {
              key = urlToKey(photoUrl as string) || '';
            } else {
              if (photoUrl.startsWith('dragonfly-trimarans.org/')) {
                key = photoUrl.replace('dragonfly-trimarans.org/', '');
              }
            }

            if (key && key.includes('temp_session_')) {
              tempKeys.push(key);
            }
          }

          if (tempKeys.length > 0) {
            console.log(`📦 Found ${tempKeys.length} temporary images to move:`, tempKeys);

            const moveResult = await moveTempImagesToBoat(tempKeys, boatId);

            if (moveResult.success && moveResult.finalUrls.length > 0) {
              await prisma.boat.update({
                where: { id: boatId },
                data: { photos: moveResult.finalUrls }
              });

              console.log(`✅ Successfully moved ${moveResult.finalUrls.length} images to final location`);
              console.log(`📍 New image URLs:`, moveResult.finalUrls);
            } else {
              console.error(`❌ Failed to move images: ${moveResult.error}`);
            }
          } else {
            console.log(`ℹ️ No temporary images found to move for boat ${boatId}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error moving images for boat ${boatId}:`, error);
      }

      // 6. Invalider le cache pour forcer le rafraîchissement des données utilisateur
      try {
        revalidateTag('user-data');
        console.log(`🔄 Cache invalidated for user data`);
      } catch (cacheError) {
        console.error(`⚠️ Error invalidating cache: ${cacheError}`);
      }

      console.log(`✅ Boat payment processed completely for PaymentIntent: ${paymentIntent.id}`);
    } catch (error) {
      console.error(`❌ Error processing boat listing payment: ${error}`);
      // Ne pas supprimer le bateau en cas d'erreur, pour permettre un traitement manuel
    }
  }
};

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    console.log('🔗 Webhook request received', {
      hasSignature: !!sig,
      bodyLength: body.length,
      headers: Object.fromEntries(req.headers.entries())
    });

    // Sécurité: ne jamais accepter un webhook Stripe sans vérification de signature.
    // Sinon, n'importe qui peut "faker" un paiement et déclencher l'activation/délivrance.
    if (!webhookSecret) {
      console.error('❌ STRIPE_WEBHOOK_SECRET is not configured');
      return new Response('Webhook Error: missing STRIPE_WEBHOOK_SECRET', {
        status: 500
      });
    }

    if (!sig) {
      console.error('❌ Missing stripe-signature header');
      return new Response('Webhook Error: missing stripe-signature header', {
        status: 400
      });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown signature error';
      console.error(`❌ Invalid Stripe webhook signature: ${msg}`);
      return new Response(`Webhook Error: ${msg}`, { status: 400 });
    }

    // Logs utiles (sans données sensibles)
    console.log(
      '🔔 Stripe webhook received and validated',
      JSON.stringify({
        id: event.id,
        type: event.type,
        created: event.created,
        livemode: event.livemode
      })
    );

    // Vérifier si un handler existe pour cet événement
    const handler = webhookHandlers[event.type];
    if (handler) {
      await handler(event);
      console.log(
        '✅ Stripe webhook handled',
        JSON.stringify({ id: event.id, type: event.type })
      );
    } else {
      console.log(
        'ℹ️ Stripe webhook ignored (no handler)',
        JSON.stringify({ id: event.id, type: event.type })
      );
    }

    // Toujours retourner 200 pour indiquer à Stripe que le webhook a été reçu
    return new Response(JSON.stringify({ received: true }));

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Erreur lors du traitement du webhook: ${errorMessage}`);
    return new Response(`Webhook Error: ${errorMessage}`, {
      status: 400
    });
  }
}
