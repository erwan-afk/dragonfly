import { betterAuth } from 'better-auth';
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from '../prisma/client';

// Only log during runtime, not during build
const isBuild = process.env.NEXT_PHASE === 'phase-production-build';

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
    sendResetPassword: async ({ user, url }: any) => {
      // Implémentez votre logique d'envoi d'email
      console.log(`📧 Reset password for ${user.email}: ${url}`);
    },
    sendVerificationEmail: async ({ user, url }: any) => {
      // Implémentez votre logique d'envoi d'email
      console.log(`📧 Verify email for ${user.email}: ${url}`);
    },
  },
  socialProviders: getSocialProviders(),
  secret: process.env.BETTER_AUTH_SECRET || 'fallback-secret-for-development',
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000'
});

if (!isBuild) {
  console.log('✅ Better Auth initialized successfully');
}

export type Session = typeof auth.$Infer.Session;
