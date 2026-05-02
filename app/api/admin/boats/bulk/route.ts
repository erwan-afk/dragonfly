import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/utils/prisma/client';
import { checkUser } from '@/utils/auth/check-user';
import { createRateLimiter, checkRateLimit } from '@/utils/rate-limit';
import { sendInvitationEmail, type BoatEmailData } from '@/utils/auth/invite';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const rateLimiter = createRateLimiter('admin_bulk_create_boat', 5, 60);

interface BoatInput {
  model: string;
  price: number | string;
  country: string;
  description: string;
  email?: string;
  ownerEmail?: string;
  condition?: string;
  photos?: string[];
  currency?: string;
  specifications?: string[];
  vatPaid?: boolean;
  planName?: string;
  expiresMonths?: number;
}

async function findOrCreateUser(email: string): Promise<{ userId: string; isNew: boolean }> {
  const normalized = email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email: normalized }, select: { id: true } });
  if (existing) return { userId: existing.id, isNew: false };

  const { hashPassword } = await import('better-auth/crypto');
  const hashed = await hashPassword(crypto.randomBytes(16).toString('base64url'));

  const newUser = await prisma.user.create({
    data: {
      email: normalized,
      name: normalized.split('@')[0],
      emailVerified: false,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });
  await prisma.account.create({
    data: {
      userId: newUser.id,
      accountId: newUser.id,
      providerId: 'credential',
      password: hashed,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });
  return { userId: newUser.id, isNew: true };
}

export async function POST(request: NextRequest) {
  try {
    const userCheck = await checkUser();

    if (!userCheck.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (userCheck.isBanned) {
      return NextResponse.json({ error: 'Account is banned' }, { status: 403 });
    }
    if (!userCheck.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const rateLimitResponse = await checkRateLimit(rateLimiter, userCheck.user!.id);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const { boats } = body;

    if (!Array.isArray(boats) || boats.length === 0) {
      return NextResponse.json({ error: 'boats must be a non-empty array' }, { status: 400 });
    }
    if (boats.length > 100) {
      return NextResponse.json({ error: 'Maximum 100 boats per request' }, { status: 400 });
    }

    // Pre-fetch all products once for plan resolution
    const products = await prisma.product.findMany({
      where: { active: true },
      select: { id: true, name: true }
    });

    const results: { index: number; boatId?: string; error?: string }[] = [];
    let created = 0;
    const newUserEmails = new Set<string>();
    const inviteBoats = new Map<string, BoatEmailData[]>(); // email → boats for new owners

    for (let i = 0; i < boats.length; i++) {
      const input: BoatInput = boats[i];

      if (!input.model || input.price === undefined || input.price === null || !input.country || !input.description) {
        results.push({ index: i, error: 'Missing required fields: model, price, country, description' });
        continue;
      }

      const numericPrice = parseFloat(String(input.price));
      if (isNaN(numericPrice) || numericPrice < 0) {
        results.push({ index: i, error: 'Invalid price' });
        continue;
      }

      const model = String(input.model).trim();
      const country = String(input.country).trim();
      const description = String(input.description).trim();

      if (model.length > 200) { results.push({ index: i, error: 'model exceeds 200 chars' }); continue; }
      if (country.length > 100) { results.push({ index: i, error: 'country exceeds 100 chars' }); continue; }
      if (description.length < 20 || description.length > 2000) {
        results.push({ index: i, error: 'description must be 20–2000 chars' });
        continue;
      }

      // Resolve plan → productId + expiresAt (per boat)
      const boatMonths = typeof input.expiresMonths === 'number' && input.expiresMonths > 0 ? input.expiresMonths : 3;
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + boatMonths);

      let productId: string | null = null;
      if (input.planName && typeof input.planName === 'string') {
        const match = products.find(
          (p) => p.name?.toLowerCase() === input.planName!.toLowerCase()
        );
        productId = match?.id ?? null;
      }

      // Resolve owner
      let ownerId = userCheck.user!.id;
      if (input.ownerEmail && typeof input.ownerEmail === 'string') {
        try {
          const { userId, isNew } = await findOrCreateUser(input.ownerEmail);
          ownerId = userId;
          if (isNew) newUserEmails.add(input.ownerEmail.toLowerCase().trim());
        } catch (err) {
          console.error(`Error resolving owner for row ${i}:`, err);
        }
      }

      try {
        const boat = await prisma.boat.create({
          data: {
            model,
            price: numericPrice,
            country,
            description,
            email: input.email ? String(input.email).slice(0, 255) : null,
            condition: input.condition ? String(input.condition).slice(0, 50) : null,
            photos: Array.isArray(input.photos) ? input.photos.slice(0, 20) : [],
            currency: input.currency || 'EUR',
            specifications: Array.isArray(input.specifications) ? input.specifications.slice(0, 50) : [],
            vatPaid: Boolean(input.vatPaid),
            userId: ownerId,
            productId,
            status: 'active',
            expiresAt
          }
        });
        results.push({ index: i, boatId: boat.id });
        created++;

        const ownerEmailKey = (input.ownerEmail || '').toLowerCase().trim();
        if (ownerEmailKey && newUserEmails.has(ownerEmailKey)) {
          const boatData: BoatEmailData = {
            id: boat.id,
            model,
            price: numericPrice,
            currency: input.currency || 'EUR',
            country,
            condition: input.condition ? String(input.condition).slice(0, 50) : null,
            description,
            photos: Array.isArray(input.photos) ? input.photos.slice(0, 20) : [],
            specifications: Array.isArray(input.specifications) ? input.specifications.slice(0, 50) : [],
          };
          const existing = inviteBoats.get(ownerEmailKey) ?? [];
          inviteBoats.set(ownerEmailKey, [...existing, boatData]);
        }
      } catch (err) {
        console.error(`Error creating boat at index ${i}:`, err);
        results.push({ index: i, error: 'Database error' });
      }
    }

    // Send invitation emails after all boats are created (deduplicated)
    for (const [email, boatData] of inviteBoats) {
      await sendInvitationEmail(email, boatData);
    }

    return NextResponse.json({ created, total: boats.length, results, invited: inviteBoats.size });
  } catch (error) {
    console.error('Error in bulk boat creation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
