import { betterAuth } from 'better-auth';
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import * as nodemailer from 'nodemailer';
import prisma from '../prisma/client';
import { isInvitation } from './invite';

// Only log during runtime, not during build
const isBuild = process.env.NEXT_PHASE === 'phase-production-build';

// Fail fast if auth secret is missing (skip during build phase)
if (!isBuild && !process.env.BETTER_AUTH_SECRET) {
  throw new Error('BETTER_AUTH_SECRET environment variable is required');
}

if (!isBuild) {
  console.log('🔍 Initializing Better Auth configuration...');
}

// Configuration des providers OAuth uniquement s'ils sont disponibles
const getSocialProviders = () => {
  const providers: any = {};
  
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    if (!isBuild) console.log('✅ Google OAuth configured');
    providers.google = {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    };
  } else {
    if (!isBuild) console.log('⚠️ Google OAuth not configured (missing credentials)');
  }
  
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    if (!isBuild) console.log('✅ GitHub OAuth configured');
    providers.github = {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    };
  } else {
    if (!isBuild) console.log('⚠️ GitHub OAuth not configured (missing credentials)');
  }
  
  return providers;
};

if (!isBuild) {
  console.log('📝 Better Auth configuration:');
  console.log('- Database adapter: Prisma with PostgreSQL');
  console.log('- Email/Password: enabled');
  console.log('- Email verification: disabled');
  console.log('- Secret:', process.env.BETTER_AUTH_SECRET ? 'configured' : 'missing');
  console.log('- Base URL:', process.env.BETTER_AUTH_URL || 'http://localhost:3000');
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    resetPasswordTokenExpiresIn: 60 * 60 * 24 * 7, // 7 days — covers invited users who don't check email immediately
    sendResetPassword: async ({ user, url }: any) => {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
        console.error('❌ SMTP non configuré — email non envoyé');
        return;
      }

      const transporter = nodemailer.createTransport({
        host: 'mail.infomaniak.com',
        port: 587,
        secure: false,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
      });

      // Detect invitation flow via the shared Set in invite.ts (set before forget-password is called)
      const isInvited = isInvitation(user.email);

      const subject = isInvited
        ? 'Your listing is live on Dragonfly Trimarans'
        : 'Reset your password';

      const html = isInvited
        ? `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1e3a8a; text-align: center;">Welcome to Dragonfly Trimarans</h1>
            <div style="background-color: #f8fafc; padding: 25px; border-radius: 8px;">
              <p style="font-size: 16px; line-height: 1.6;">
                Hello <strong>${user.name || user.email}</strong>,
              </p>
              <p style="font-size: 16px; line-height: 1.6;">
                Your listing has been published on <strong>Dragonfly Trimarans</strong>, the marketplace dedicated to trimarans.
              </p>
              <p style="font-size: 16px; line-height: 1.6;">
                Create your password to access your account and manage your listings:
              </p>
              <div style="text-align: center; margin: 25px 0;">
                <a href="${url}"
                   style="background-color: #1e3a8a; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  Create my password
                </a>
              </div>
              <p style="color: #6b7280; font-size: 14px;">
                This link expires in 7 days.
              </p>
            </div>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; text-align: center;">
              This email was sent automatically by Dragonfly Trimarans.
            </p>
          </div>
        `
        : `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1e3a8a; text-align: center;">Password Reset</h1>
            <div style="background-color: #f8fafc; padding: 25px; border-radius: 8px;">
              <p style="font-size: 16px; line-height: 1.6;">
                Hello <strong>${user.name || 'there'}</strong>,
              </p>
              <p style="font-size: 16px; line-height: 1.6;">
                You requested a password reset. Click the button below to create a new one.
              </p>
              <div style="text-align: center; margin: 25px 0;">
                <a href="${url}"
                   style="background-color: #1e3a8a; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  Reset my password
                </a>
              </div>
              <p style="color: #6b7280; font-size: 14px;">
                This link expires in 7 days. If you did not request this, please ignore this email.
              </p>
            </div>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; text-align: center;">
              This email was sent automatically by Dragonfly Trimarans.
            </p>
          </div>
        `;

      const text = isInvited
        ? `Hello ${user.name || user.email},\n\nYour listing has been published on Dragonfly Trimarans.\n\nCreate your password to access your account:\n${url}\n\nThis link expires in 7 days.\n\nDragonfly Trimarans`
        : `Hello ${user.name || 'there'},\n\nYou requested a password reset. Use the link below to create a new password:\n${url}\n\nThis link expires in 7 days. If you did not request this, please ignore this email.\n\nDragonfly Trimarans`;

      try {
        await transporter.sendMail({
          from: `"Dragonfly Trimarans" <${process.env.SMTP_USER}>`,
          to: user.email,
          subject,
          html,
          text,
        });

        await prisma.email_log.create({
          data: {
            type: isInvited ? 'invitation' : 'password_reset',
            userId: user.id,
            email: user.email,
          },
        });

        console.log(`✅ ${isInvited ? 'Invitation' : 'Reset'} email sent to ${user.email}`);
      } catch (error) {
        console.error(`❌ Failed to send email to ${user.email}:`, error);
      }
    },
    sendVerificationEmail: async ({ user, url }: any) => {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
        console.error('❌ SMTP not configured — verification email not sent');
        return;
      }

      const transporter = nodemailer.createTransport({
        host: 'mail.infomaniak.com',
        port: 587,
        secure: false,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
      });

      try {
        await transporter.sendMail({
          from: `"Dragonfly Trimarans" <${process.env.SMTP_USER}>`,
          to: user.email,
          subject: 'Verify your email address',
          text: `Hello ${user.name || 'there'},\n\nPlease verify your email address by clicking the link below:\n${url}\n\nDragonfly Trimarans`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #1e3a8a; text-align: center;">Verify your email</h1>
              <div style="background-color: #f8fafc; padding: 25px; border-radius: 8px;">
                <p style="font-size: 16px; line-height: 1.6;">
                  Hello <strong>${user.name || 'there'}</strong>,
                </p>
                <p style="font-size: 16px; line-height: 1.6;">
                  Please confirm your email address by clicking the button below.
                </p>
                <div style="text-align: center; margin: 25px 0;">
                  <a href="${url}"
                     style="background-color: #1e3a8a; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                    Verify my email
                  </a>
                </div>
              </div>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px; text-align: center;">
                This email was sent automatically by Dragonfly Trimarans.
              </p>
            </div>
          `,
        });
        console.log(`✅ Verification email sent to ${user.email}`);
      } catch (error) {
        console.error(`❌ Failed to send verification email to ${user.email}:`, error);
      }
    },
  },
  socialProviders: getSocialProviders(),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  pages: {
    error: '/auth/error',
  },
  plugins: [
    admin({
      defaultRole: "user",
      adminRole: "admin",
    })
  ],
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
        input: false, // Don't allow users to set their own role
      }
    }
  }
});

if (!isBuild) {
  console.log('✅ Better Auth initialized successfully');
}

export type Session = typeof auth.$Infer.Session;
