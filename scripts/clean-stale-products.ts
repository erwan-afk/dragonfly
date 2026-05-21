/**
 * Removes products/prices from the local DB that no longer exist on Stripe
 * (typically: residue from a previous LIVE-mode sync after switching to TEST mode).
 *
 * Reads STRIPE_SECRET_KEY + DATABASE_URL from .env.local — make sure they point
 * to the environment you want to clean (dev DB + test key, or prod DB + live key).
 *
 * Dry-run by default. Pass --apply to actually delete.
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import Stripe from 'stripe';
import prisma from '../utils/prisma';

const APPLY = process.argv.includes('--apply');

async function main() {
  const key = process.env.STRIPE_SECRET_KEY || '';
  if (!key) {
    console.error('❌ STRIPE_SECRET_KEY missing in .env.local');
    process.exit(1);
  }
  const mode = key.startsWith('sk_live_') ? 'LIVE' : 'TEST';
  console.log(`🔑 Stripe mode: ${mode}`);
  console.log(`📦 DB: ${process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':***@')}`);
  console.log(`🧪 Dry-run: ${!APPLY} (pass --apply to delete)\n`);

  const stripe = new Stripe(key, { apiVersion: '2023-10-16' });

  // 1. Collect all live (= current Stripe mode) product + price IDs
  const validProductIds = new Set<string>();
  const validPriceIds = new Set<string>();

  for await (const product of stripe.products.list({ limit: 100 })) {
    validProductIds.add(product.id);
  }
  for await (const price of stripe.prices.list({ limit: 100 })) {
    validPriceIds.add(price.id);
  }

  console.log(
    `✅ Stripe ${mode}: ${validProductIds.size} products, ${validPriceIds.size} prices\n`
  );

  // 2. Find DB rows that are NOT in Stripe (any longer)
  const dbProducts = await prisma.product.findMany({
    select: { id: true, name: true, active: true }
  });
  const dbPrices = await prisma.price.findMany({
    select: { id: true, productId: true, unitAmount: true, currency: true }
  });

  const staleProducts = dbProducts.filter((p) => !validProductIds.has(p.id));
  const stalePrices = dbPrices.filter((p) => !validPriceIds.has(p.id));

  console.log(
    `🔍 In DB: ${dbProducts.length} products / ${dbPrices.length} prices`
  );
  console.log(
    `🗑  Stale: ${staleProducts.length} products / ${stalePrices.length} prices\n`
  );

  if (staleProducts.length === 0 && stalePrices.length === 0) {
    console.log('✨ Nothing to clean.');
    return;
  }

  if (staleProducts.length > 0) {
    console.log('Stale products (will be deleted):');
    for (const p of staleProducts) {
      console.log(`  - ${p.id}  "${p.name}"  active=${p.active}`);
    }
    console.log();
  }
  if (stalePrices.length > 0) {
    console.log('Stale prices (will be deleted):');
    for (const p of stalePrices) {
      console.log(
        `  - ${p.id}  product=${p.productId}  ${p.unitAmount} ${p.currency}`
      );
    }
    console.log();
  }

  if (!APPLY) {
    console.log('⚠️  Dry-run only. Rerun with --apply to perform deletion.');
    return;
  }

  // 3. Build a stale → valid mapping by product NAME (case-insensitive)
  const validByName = new Map<string, string>();
  for (const p of dbProducts) {
    if (validProductIds.has(p.id) && p.name) {
      validByName.set(p.name.trim().toLowerCase(), p.id);
    }
  }

  const reassignMap: { stale: typeof staleProducts[0]; targetId: string }[] = [];
  const unmappable: typeof staleProducts = [];
  for (const sp of staleProducts) {
    const target = sp.name ? validByName.get(sp.name.trim().toLowerCase()) : undefined;
    if (target) reassignMap.push({ stale: sp, targetId: target });
    else unmappable.push(sp);
  }

  if (reassignMap.length > 0) {
    console.log('Reassign map (stale LIVE → valid TEST, matched by name):');
    for (const m of reassignMap) {
      console.log(`  - ${m.stale.id}  "${m.stale.name}"  →  ${m.targetId}`);
    }
    console.log();
  }
  if (unmappable.length > 0) {
    console.warn('⚠️  Stale products with NO matching name in valid set:');
    for (const sp of unmappable) {
      console.warn(`  - ${sp.id}  "${sp.name}"`);
    }
    console.warn(
      '   These cannot be reassigned. If anything still references them the script will abort.\n'
    );
  }

  // 4. Reassign boat.productId and payment.productId from stale → target
  let totalBoatsReassigned = 0;
  let totalPaymentsReassigned = 0;
  for (const { stale, targetId } of reassignMap) {
    const b = await prisma.boat.updateMany({
      where: { productId: stale.id },
      data: { productId: targetId }
    });
    const p = await prisma.payment.updateMany({
      where: { productId: stale.id },
      data: { productId: targetId }
    });
    totalBoatsReassigned += b.count;
    totalPaymentsReassigned += p.count;
    if (b.count + p.count > 0) {
      console.log(
        `   ↪ "${stale.name}": reassigned ${b.count} boat(s) and ${p.count} payment(s)`
      );
    }
  }
  if (totalBoatsReassigned + totalPaymentsReassigned > 0) {
    console.log(
      `\n✅ Reassignment: ${totalBoatsReassigned} boats, ${totalPaymentsReassigned} payments\n`
    );
  }

  // 5. Safety check: anything still pointing at the stale ids?
  const stalePriceIds = stalePrices.map((p) => p.id);
  const staleProductIds = staleProducts.map((p) => p.id);

  const remainingBoats = await prisma.boat.count({
    where: { productId: { in: staleProductIds } }
  });
  const remainingPayments = await prisma.payment.count({
    where: { productId: { in: staleProductIds } }
  });

  if (remainingBoats > 0 || remainingPayments > 0) {
    console.warn(
      `⚠️  After reassignment, still ${remainingBoats} boat(s) and ${remainingPayments} payment(s) reference stale products.`
    );
    console.warn(
      '   These belong to "unmappable" products listed above. Aborting deletion to avoid FK errors.'
    );
    return;
  }

  // 6. Delete prices first, then products
  const delPrices = await prisma.price.deleteMany({
    where: { id: { in: stalePriceIds } }
  });
  const delProducts = await prisma.product.deleteMany({
    where: { id: { in: staleProductIds } }
  });

  console.log(`✅ Deleted ${delPrices.count} prices`);
  console.log(`✅ Deleted ${delProducts.count} products`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('❌ Failed:', e);
    process.exit(1);
  });
