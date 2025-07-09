// Charger les variables d'environnement depuis .env.local
import * as dotenv from 'dotenv';
import * as path from 'path';

// Charger le fichier .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import Stripe from 'stripe';
import { upsertProductRecord, upsertPriceRecord } from '@/utils/prisma/admin';

// Créer l'instance Stripe directement après chargement des variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

async function syncStripeProducts() {
  console.log('🔄 Starting Stripe products synchronization...');
  console.log('🔑 Stripe Secret Key:', process.env.STRIPE_SECRET_KEY ? `${process.env.STRIPE_SECRET_KEY.substring(0, 8)}...` : 'NOT FOUND');
  
  try {
    // Récupérer tous les produits actifs depuis Stripe
    console.log('📦 Fetching products from Stripe...');
    const products = await stripe.products.list({
      active: true,
      limit: 100,
    });

    console.log(`✅ Found ${products.data.length} products on Stripe`);

    // Synchroniser chaque produit
    for (const product of products.data) {
      console.log(`🔄 Syncing product: ${product.name} (${product.id})`);
      
      try {
        await upsertProductRecord(product);
        console.log(`✅ Product synced: ${product.name}`);
      } catch (error) {
        console.error(`❌ Error syncing product ${product.name}:`, error);
      }
    }

    // Récupérer tous les prix actifs depuis Stripe
    console.log('💰 Fetching prices from Stripe...');
    const prices = await stripe.prices.list({
      active: true,
      limit: 100,
    });

    console.log(`✅ Found ${prices.data.length} prices on Stripe`);

    // Synchroniser chaque prix
    for (const price of prices.data) {
      console.log(`🔄 Syncing price: ${price.id} (${price.unit_amount} ${price.currency})`);
      
      try {
        await upsertPriceRecord(price);
        console.log(`✅ Price synced: ${price.id}`);
      } catch (error) {
        console.error(`❌ Error syncing price ${price.id}:`, error);
      }
    }

    console.log('🎉 Stripe products synchronization completed!');

  } catch (error) {
    console.error('❌ Error during Stripe synchronization:', error);
    process.exit(1);
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  syncStripeProducts()
    .then(() => {
      console.log('✅ Synchronization finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Synchronization failed:', error);
      process.exit(1);
    });
}

export { syncStripeProducts }; 