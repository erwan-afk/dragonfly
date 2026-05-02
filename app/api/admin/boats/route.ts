import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/utils/prisma/client';
import { checkUser } from '@/utils/auth/check-user';
import { createRateLimiter, checkRateLimit } from '@/utils/rate-limit';
import { sendInvitationEmail } from '@/utils/auth/invite';

export const dynamic = 'force-dynamic';

const rateLimiter = createRateLimiter('admin_create_boat', 30, 60);

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
    const {
      model,
      price,
      country,
      description,
      email,
      condition,
      photos,
      currency,
      specifications,
      vatPaid,
      expiresMonths,
      ownerEmail
    } = body;

    if (!model || price === undefined || price === null || !country || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: model, price, country, description' },
        { status: 400 }
      );
    }

    if (typeof model !== 'string' || model.length > 200) {
      return NextResponse.json({ error: 'model must be a string under 200 chars' }, { status: 400 });
    }

    if (typeof country !== 'string' || country.length > 100) {
      return NextResponse.json({ error: 'country must be a string under 100 chars' }, { status: 400 });
    }

    if (typeof description !== 'string' || description.length < 20 || description.length > 2000) {
      return NextResponse.json({ error: 'description must be 20–2000 chars' }, { status: 400 });
    }

    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
    }

    const months = typeof expiresMonths === 'number' && expiresMonths > 0 ? expiresMonths : 3;
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + months);

    // Resolve owner: find or create user from ownerEmail
    let ownerId = userCheck.user!.id;
    let isNewOwner = false;

    if (ownerEmail && typeof ownerEmail === 'string') {
      const normalized = ownerEmail.toLowerCase().trim();
      const existing = await prisma.user.findUnique({ where: { email: normalized }, select: { id: true } });
      if (existing) {
        ownerId = existing.id;
      } else {
        const { hashPassword } = await import('better-auth/crypto');
        const crypto = (await import('crypto')).default;
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
        ownerId = newUser.id;
        isNewOwner = true;
      }
    }

    const boat = await prisma.boat.create({
      data: {
        model: model.trim(),
        price: numericPrice,
        country: country.trim(),
        description: description.trim(),
        email: email ? String(email).slice(0, 255) : null,
        condition: condition ? String(condition).slice(0, 50) : null,
        photos: Array.isArray(photos) ? photos.slice(0, 20) : [],
        currency: currency || 'EUR',
        specifications: Array.isArray(specifications) ? specifications.slice(0, 50) : [],
        vatPaid: Boolean(vatPaid),
        userId: ownerId,
        status: 'active',
        expiresAt
      }
    });

    if (isNewOwner && ownerEmail) {
      await sendInvitationEmail(ownerEmail.toLowerCase().trim());
    }

    return NextResponse.json({ success: true, boat });
  } catch (error) {
    console.error('Error creating boat (admin):', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const patchRateLimiter = createRateLimiter('admin_patch_boat', 60, 60);

export async function PATCH(request: NextRequest) {
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

    const rateLimitResponse = await checkRateLimit(patchRateLimiter, userCheck.user!.id);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const { boatId, photos } = body;

    if (!boatId || !Array.isArray(photos)) {
      return NextResponse.json({ error: 'boatId and photos array required' }, { status: 400 });
    }

    const boat = await prisma.boat.update({
      where: { id: boatId },
      data: { photos: photos.slice(0, 20) }
    });

    return NextResponse.json({ success: true, boat });
  } catch (error) {
    console.error('Error patching boat photos (admin):', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
