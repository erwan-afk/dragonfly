import { betterAuth } from 'better-auth';
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import * as nodemailer from 'nodemailer';
import prisma from '../prisma/client';
import { recordEmail } from '../email-tracking';
import { buildPasswordResetEmail, buildVerificationEmail } from '../email-account';

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

      const { subject, html, text } = buildPasswordResetEmail(user.name, url);

      try {
        const info = await transporter.sendMail({
          from: `"3Hulls" <${process.env.SMTP_USER}>`,
          to: user.email,
          subject,
          html,
          text,
        });
        await recordEmail({ type: 'password_reset', to: user.email, subject, userId: user.id, info });

        await prisma.email_log.create({
          data: {
            type: 'password_reset',
            userId: user.id,
            email: user.email,
          },
        });

        console.log(`✅ Reset email sent to ${user.email}`);
      } catch (error) {
        console.error(`❌ Failed to send email to ${user.email}:`, error);
        await recordEmail({ type: 'password_reset', to: user.email, subject, userId: user.id, error });
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

      const { subject, html, text } = buildVerificationEmail(user.name, url);

      try {
        const info = await transporter.sendMail({
          from: `"3Hulls" <${process.env.SMTP_USER}>`,
          to: user.email,
          subject,
          text,
          html,
        });
        await recordEmail({ type: 'verification', to: user.email, subject, userId: user.id, info });
        console.log(`✅ Verification email sent to ${user.email}`);
      } catch (error) {
        console.error(`❌ Failed to send verification email to ${user.email}:`, error);
        await recordEmail({ type: 'verification', to: user.email, subject, userId: user.id, error });
      }
    },
  },
  socialProviders: getSocialProviders(),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  // Both dragonfly-trimarans.org and 3hulls.com serve this same app permanently,
  // so requests originating from either host must pass Better Auth's origin check.
  trustedOrigins: [
    'https://dragonfly-trimarans.org',
    'https://www.dragonfly-trimarans.org',
    'https://3hulls.com',
    'https://www.3hulls.com',
  ],
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
