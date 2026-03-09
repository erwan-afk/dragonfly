import { NextRequest, NextResponse } from 'next/server';
import { checkUser } from '@/utils/auth/check-user';
import prisma from '@/utils/prisma/client';
import { createRateLimiter, checkRateLimit } from '@/utils/rate-limit';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const rateLimiter = createRateLimiter('admin_reset_password', 5, 60);

const transporter = nodemailer.createTransport({
  host: 'mail.infomaniak.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

export async function POST(request: NextRequest) {
  const rateLimitResponse = await checkRateLimit(
    rateLimiter,
    request.headers.get('x-forwarded-for') || 'unknown'
  );
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const userCheck = await checkUser();
    if (!userCheck.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Cannot reset superAdmin password unless you are superAdmin
    if (targetUser.role === 'superAdmin' && !userCheck.isSuperAdmin) {
      return NextResponse.json({ error: 'Cannot reset super admin password' }, { status: 403 });
    }

    // Generate a temporary password
    const tempPassword = crypto.randomBytes(12).toString('base64url');

    // Hash the password using Better Auth's method (scrypt)
    const { hashPassword } = await import('better-auth/crypto');
    const hashedPassword = await hashPassword(tempPassword);

    // Update the password in the account table
    const account = await prisma.account.findFirst({
      where: {
        userId: targetUser.id,
        providerId: 'credential'
      }
    });

    if (!account) {
      return NextResponse.json(
        { error: 'User does not have a password account (OAuth only)' },
        { status: 400 }
      );
    }

    await prisma.account.update({
      where: { id: account.id },
      data: { password: hashedPassword }
    });

    // Send email with temporary password
    const baseUrl = process.env.BETTER_AUTH_URL;

    await transporter.sendMail({
      from: `"Dragonfly Trimarans" <${process.env.SMTP_USER}>`,
      to: targetUser.email,
      subject: 'Your password has been reset - Dragonfly Trimarans',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1e3a5f;">Password Reset</h2>
          <p>Hello ${targetUser.name || 'there'},</p>
          <p>An administrator has reset your password. Here is your temporary password:</p>
          <div style="background: #f0f4f8; padding: 16px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <code style="font-size: 18px; font-weight: bold; color: #1e3a5f; letter-spacing: 1px;">${tempPassword}</code>
          </div>
          <p>Please <a href="${baseUrl}/signin" style="color: #1e3a5f; font-weight: bold;">sign in</a> with this temporary password and change it immediately in your account settings.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;" />
          <p style="color: #888; font-size: 12px;">If you did not expect this email, please contact our support team.</p>
          <p style="color: #888; font-size: 12px;">Dragonfly Trimarans</p>
        </div>
      `
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
