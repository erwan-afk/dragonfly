import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/utils/prisma/client';
import { checkUser } from '@/utils/auth/check-user';
import { createRateLimiter, checkRateLimit } from '@/utils/rate-limit';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const rateLimiter = createRateLimiter('admin_create_user', 20, 60);

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
    const { email, name } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true }
    });

    if (existing) {
      return NextResponse.json({ userId: existing.id, isNew: false });
    }

    // Create new user with a random temp password
    const { hashPassword } = await import('better-auth/crypto');
    const tempPassword = crypto.randomBytes(16).toString('base64url');
    const hashedPassword = await hashPassword(tempPassword);

    const derivedName = name?.trim() || normalizedEmail.split('@')[0];

    const newUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: derivedName,
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
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ userId: newUser.id, isNew: true });
  } catch (error) {
    console.error('Error creating user (admin):', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
