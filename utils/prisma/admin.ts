import { stripe } from '@/utils/stripe/config';
import { moveTempImagesToBoat, deleteTempSessionImages } from '@/utils/cloudflare/r2';
import prisma from '../prisma';
import type Stripe from 'stripe';

// 🔄 MIGRATION: upsertProductRecord
const upsertProductRecord = async (product: Stripe.Product) => {
  const productData = {
    id: product.id,
    active: product.active,
    name: product.name,
    description: product.description ?? null,
    image: product.images?.[0] ?? null,
    metadata: product.metadata as any, // Prisma Json type
  };

  try {
    await prisma.product.upsert({
      where: { id: product.id },
      update: productData,
      create: productData,
    });
    console.log(`Product inserted/updated: ${product.id}`);
  } catch (error: any) {
    throw new Error(`Product insert/update failed: ${error.message}`);
  }
};

// 🔄 MIGRATION: upsertPriceRecord  
const upsertPriceRecord = async (price: Stripe.Price, retryCount = 0, maxRetries = 3) => {
  const priceData = {
    id: price.id,
    productId: typeof price.product === 'string' ? price.product : '',
    active: price.active,
    currency: price.currency,
    type: price.type,
    unitAmount: price.unit_amount,
    interval: price.recurring?.interval ?? null,
    intervalCount: price.recurring?.interval_count ?? null,
    trialPeriodDays: price.recurring?.trial_period_days ?? null,
    description: price.nickname ?? null,
  };

  try {
    await prisma.price.upsert({
      where: { id: price.id },
      update: priceData,  
      create: priceData,
    });
    console.log(`Price inserted/updated: ${price.id}`);
  } catch (error: any) {
    if (error.message.includes('foreign key constraint')) {
      if (retryCount < maxRetries) {
        console.log(`Retry attempt ${retryCount + 1} for price ID: ${price.id}`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await upsertPriceRecord(price, retryCount + 1, maxRetries);
      } else {
        throw new Error(`Price insert/update failed after ${maxRetries} retries: ${error.message}`);
      }
    } else {
      throw new Error(`Price insert/update failed: ${error.message}`);
    }
  }
};

// 🔄 MIGRATION: handleBoatListingPayment - LA FONCTION PRINCIPALE
export const handleBoatListingPayment = async (session: Stripe.Checkout.Session, customerId: string) => {
  try {
    // 🔎 Recherche du client à partir de l'ID Stripe
    console.log("🔍 Recherche du client dans 'customers'...");
    
    const customer = await prisma.customer.findFirst({
      where: { stripeCustomerId: customerId }
    });

    if (!customer) {
      throw new Error(`Customer lookup failed: No customer found with Stripe ID: ${customerId}`);
    }

    const userId = customer.id;
    console.log("✅ Client trouvé avec ID:", userId);

    // 🚢 Création de l'entrée du bateau avec les vraies données
    const model = session.metadata?.boat_model || 'Unknown';
    const price = parseFloat(session.metadata?.boat_price || '0');
    const country = session.metadata?.boat_country || 'Unknown';
    const description = session.metadata?.boat_description || 'No description';
    const currency = session.metadata?.boat_currency || 'EUR';
    const specifications = session.metadata?.boat_specifications ? JSON.parse(session.metadata.boat_specifications) : [];
    const vatPaid = session.metadata?.boat_vat_paid === 'true';
    const tempImageKeys = session.metadata?.temp_image_keys || '';

    console.log("🛠️ Création du bateau...");

    // 📷 Traiter les images temporaires s'il y en a
    let finalPhotoUrls: string[] = [];
    let createdBoatId: string;

    if (tempImageKeys) {
      try {
        const tempKeys = JSON.parse(tempImageKeys) as string[];
        console.log(`📸 ${tempKeys.length} images temporaires à traiter pour le bateau`);
        
        if (tempKeys.length > 0) {
          // Créer d'abord le bateau pour avoir un ID
          const tempBoat = await prisma.boat.create({
            data: {
              model,
              price,
              country,
              description,
              photos: [], // Photos vides pour l'instant
              userId,
              currency,
              specifications,
              vatPaid,
            }
          });

          console.log("✅ Bateau créé avec ID:", tempBoat.id);
          createdBoatId = tempBoat.id;

          // Déplacer les images vers le dossier final
          const moveResult = await moveTempImagesToBoat(tempKeys, tempBoat.id);
          
          if (moveResult.success) {
            finalPhotoUrls = moveResult.finalUrls;
            console.log(`✅ ${finalPhotoUrls.length} images déplacées avec succès`);

            // Mettre à jour le bateau avec les URLs finales
            await prisma.boat.update({
              where: { id: tempBoat.id },
              data: { photos: finalPhotoUrls }
            });

            console.log("✅ URLs des photos mises à jour dans la base de données");

            // Nettoyer les images temporaires restantes de cette session
            try {
              // Extraire le sessionId de la première clé temporaire
              const firstTempKey = tempKeys[0];
              const sessionMatch = firstTempKey.match(/temp_session_([^/]+)/);
              
              if (sessionMatch) {
                const sessionId = sessionMatch[1];
                console.log(`🧹 Nettoyage des images temporaires pour la session: ${sessionId}`);
                
                const cleanupResult = await deleteTempSessionImages(sessionId);
                if (cleanupResult) {
                  console.log(`✅ Images temporaires nettoyées pour la session: ${sessionId}`);
                } else {
                  console.log(`⚠️ Échec du nettoyage des images temporaires pour la session: ${sessionId}`);
                }
              }
            } catch (cleanupError) {
              console.error('❌ Erreur lors du nettoyage des images temporaires:', cleanupError);
              // Ne pas faire échouer le processus principal pour cette erreur
            }
          } else {
            console.error('❌ Erreur lors du déplacement des images:', moveResult.error);
          }
        } else {
          // Pas d'images temporaires, créer le bateau directement
          const createdBoat = await prisma.boat.create({
            data: {
              model,
              price,
              country,
              description,
              photos: finalPhotoUrls,
              userId,
              currency,
              specifications,
              vatPaid,
            }
          });

          console.log("✅ Bateau créé avec ID:", createdBoat.id);
          createdBoatId = createdBoat.id;
        }
      } catch (error) {
        console.error('❌ Erreur lors du traitement des images temporaires:', error);
        // Créer le bateau sans images en cas d'erreur
        const createdBoat = await prisma.boat.create({
          data: {
            model,
            price,
            country,
            description,
            photos: [],
            userId,
            currency,
            specifications,
            vatPaid,
          }
        });
        console.log("✅ Bateau créé sans images avec ID:", createdBoat.id);
        createdBoatId = createdBoat.id;
      }
    } else {
      // Pas d'images temporaires, créer le bateau directement
      const createdBoat = await prisma.boat.create({
        data: {
          model,
          price,
          country,
          description,
          photos: finalPhotoUrls,
          userId,
          currency,
          specifications,
          vatPaid,
        }
      });

      console.log("✅ Bateau créé avec ID:", createdBoat.id);
      createdBoatId = createdBoat.id;
    }

    // 💳 Création de l'entrée du paiement
    const amount = (session.amount_total || 0) / 100; // Stripe utilise les centimes
    const status = session.payment_status || 'incomplete';
    const stripeSessionId = session.id;

    console.log("🛠️ Création du paiement...");

    const createdPayment = await prisma.payment.create({
      data: {
        userId,
        boatId: createdBoatId,
        amount,
        status,
        stripeSessionId,
      }
    });

    console.log(`✅ Paiement enregistré avec ID: ${createdPayment.id} pour le bateau: ${createdBoatId}`);
    
    return createdBoatId;

  } catch (error) {
    console.error('❌ Erreur dans handleBoatListingPayment:', error);
    throw error;
  }
};

// 🔄 MIGRATION: Autres fonctions...
const deleteProductRecord = async (product: Stripe.Product) => {
  try {
    await prisma.product.delete({
      where: { id: product.id }
    });
    console.log(`Product deleted: ${product.id}`);
  } catch (error: any) {
    throw new Error(`Product deletion failed: ${error.message}`);
  }
};

const deletePriceRecord = async (price: Stripe.Price) => {
  try {
    await prisma.price.delete({
      where: { id: price.id }
    });
    console.log(`Price deleted: ${price.id}`);
  } catch (error: any) {
    throw new Error(`Price deletion failed: ${error.message}`);
  }
};

const upsertCustomerToPrisma = async (uuid: string, customerId: string) => {
  try {
    await prisma.$executeRaw`
      INSERT INTO customers (id, stripe_customer_id) 
      VALUES (${uuid}, ${customerId})
      ON CONFLICT (id) 
      DO UPDATE SET stripe_customer_id = ${customerId}
    `;
    return customerId;
  } catch (error: any) {
    throw new Error(`Prisma customer record creation failed: ${error.message}`);
  }
};

const createCustomerInStripe = async (uuid: string, email: string) => {
  const customerData = {
    metadata: { supabaseUUID: uuid },
    email: email
  };
  
  const newCustomer = await stripe.customers.create(customerData);
  if (!newCustomer) throw new Error('Stripe customer creation failed.');
  
  return newCustomer.id;
};

const createOrRetrieveCustomer = async ({
  email,
  uuid
}: {
  email: string;
  uuid: string;
}) => {
  // Recherche du client existant dans Prisma
  const existingPrismaCustomerResult = await prisma.$queryRaw`
    SELECT id, stripe_customer_id FROM customers WHERE id = ${uuid}
  ` as any[];
  
  const existingPrismaCustomer = existingPrismaCustomerResult.length > 0 ? existingPrismaCustomerResult[0] : null;

  let stripeCustomerId: string | undefined;
  
  if (existingPrismaCustomer?.stripe_customer_id) {
    const existingStripeCustomer = await stripe.customers.retrieve(
      existingPrismaCustomer.stripe_customer_id
    );
    stripeCustomerId = existingStripeCustomer.id;
  } else {
    const stripeCustomers = await stripe.customers.list({ email: email });
    stripeCustomerId = stripeCustomers.data.length > 0 ? stripeCustomers.data[0].id : undefined;
  }

  const stripeIdToInsert = stripeCustomerId 
    ? stripeCustomerId 
    : await createCustomerInStripe(uuid, email);

  if (!stripeIdToInsert) throw new Error('Stripe customer creation failed.');

  if (existingPrismaCustomer && stripeCustomerId) {
    if (existingPrismaCustomer.stripe_customer_id !== stripeCustomerId) {
      await prisma.$executeRaw`
        UPDATE customers SET stripe_customer_id = ${stripeCustomerId} WHERE id = ${uuid}
      `;
      console.warn(`Prisma customer record mismatched Stripe ID. Prisma record updated.`);
    }
    return stripeCustomerId;
  } else {
    console.warn(`Prisma customer record was missing. A new record was created.`);
    const upsertedStripeCustomer = await upsertCustomerToPrisma(uuid, stripeIdToInsert);
    if (!upsertedStripeCustomer) throw new Error('Prisma customer record creation failed.');
    return upsertedStripeCustomer;
  }
};

export {
  upsertProductRecord,
  upsertPriceRecord, 
  deleteProductRecord,
  deletePriceRecord,
  createOrRetrieveCustomer
};
