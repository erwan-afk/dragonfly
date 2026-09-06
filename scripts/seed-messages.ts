#!/usr/bin/env tsx

/**
 * PROTOTYPE/TEST DATA — seeds a buyer, a seller and one active listing so the
 * /messages flow can be exercised end-to-end on localhost without touching
 * real user accounts. Safe to re-run (idempotent upserts). Test accounts are
 * clearly namespaced (messages-test-*) so they're easy to find and delete.
 */

import { PrismaClient } from '@prisma/client';
import { hashPassword } from 'better-auth/crypto';

const prisma = new PrismaClient();

const TEST_PASSWORD = 'Messages-test-1234!';

const BUYER = {
  email: 'messages-test-buyer@example.com',
  name: 'Messages Test Buyer'
};

const SELLER = {
  email: 'messages-test-seller@example.com',
  name: 'Messages Test Seller'
};

async function upsertTestUser(email: string, name: string): Promise<string> {
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true }
  });
  if (existing) return existing.id;

  const hashedPassword = await hashPassword(TEST_PASSWORD);

  const user = await prisma.user.create({
    data: {
      email,
      name,
      emailVerified: true,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });

  await prisma.account.create({
    data: {
      userId: user.id,
      accountId: user.id,
      providerId: 'credential',
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });

  return user.id;
}

async function upsertTestBoat(sellerId: string): Promise<string> {
  const existing = await prisma.boat.findFirst({
    where: { userId: sellerId, model: 'df800' },
    select: { id: true }
  });
  if (existing) {
    // Make sure it's still active for the "new conversation" flow to work.
    await prisma.boat.update({
      where: { id: existing.id },
      data: { status: 'active' }
    });
    return existing.id;
  }

  const boat = await prisma.boat.create({
    data: {
      model: 'df800',
      price: 89000,
      currency: 'EUR',
      country: 'france',
      description:
        'Messages test listing — Dragonfly 800 in great condition, well maintained, ready to sail. ' +
        'This is seeded test data used to exercise the /messages flow on localhost: sails, rigging and ' +
        'electronics recently serviced, always kept in a marina, no major repairs needed. Lightly used, ' +
        'perfect for coastal cruising or weekend trips. Contact the seller for more photos and a full survey report.',
      condition: 'used',
      year: 2018,
      photos: [],
      userId: sellerId,
      status: 'active',
      vatPaid: true,
      specifications: []
    }
  });

  return boat.id;
}

async function seed() {
  console.log('🌱 Seeding Messages test data...');

  const buyerId = await upsertTestUser(BUYER.email, BUYER.name);
  console.log(`   ✅ Buyer  → ${BUYER.email} (${buyerId})`);

  const sellerId = await upsertTestUser(SELLER.email, SELLER.name);
  console.log(`   ✅ Seller → ${SELLER.email} (${sellerId})`);

  const boatId = await upsertTestBoat(sellerId);
  console.log(`   ✅ Listing → /boat/${boatId} (active, owned by seller)`);

  console.log('\n── Test accounts (password for both) ──');
  console.log(`   Password: ${TEST_PASSWORD}`);
  console.log(`   Buyer  sign-in: ${BUYER.email}`);
  console.log(`   Seller sign-in: ${SELLER.email}`);
  console.log('\n── Suggested manual test flow ──');
  console.log(`   1. Sign in as the buyer, open http://localhost:3000/boat/${boatId}`);
  console.log('   2. Click "Send a message" and send a first message.');
  console.log('   3. Sign in as the seller (different browser/incognito), open /messages, reply.');
  console.log('✅ Done');
}

seed()
  .catch((error) => {
    console.error('❌ Error seeding messages test data:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
