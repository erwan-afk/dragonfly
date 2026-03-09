import { betterAuth } from 'better-auth';
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import * as nodemailer from 'nodemailer';
import prisma from '../prisma/client';

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
    sendResetPassword: async ({ user, url }: any) => {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
        console.error('❌ SMTP non configuré — email de reset non envoyé');
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
          subject: '🔑 Réinitialisation de votre mot de passe',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #1e3a8a; text-align: center;">🔑 Mot de passe oublié</h1>
              <div style="background-color: #f8fafc; padding: 25px; border-radius: 8px;">
                <p style="font-size: 16px; line-height: 1.6;">
                  Bonjour <strong>${user.name || 'Cher utilisateur'}</strong>,
                </p>
                <p style="font-size: 16px; line-height: 1.6;">
                  Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour en créer un nouveau.
                </p>
                <div style="text-align: center; margin: 25px 0;">
                  <a href="${url}"
                     style="background-color: #1e3a8a; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                    Réinitialiser mon mot de passe
                  </a>
                </div>
                <p style="color: #6b7280; font-size: 14px;">
                  Ce lien expire dans 1 heure. Si vous n'avez pas fait cette demande, ignorez cet email.
                </p>
              </div>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px; text-align: center;">
                Cet email a été envoyé automatiquement par Dragonfly Trimarans.
              </p>
            </div>
          `,
        });

        // Log dans email_logs
        await prisma.email_log.create({
          data: {
            type: 'password_reset',
            userId: user.id,
            email: user.email,
          },
        });

        console.log(`✅ Email de reset envoyé à ${user.email}`);
      } catch (error) {
        console.error(`❌ Erreur envoi email reset à ${user.email}:`, error);
      }
    },
    sendVerificationEmail: async ({ user, url }: any) => {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
        console.error('❌ SMTP non configuré — email de vérification non envoyé');
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
          subject: '✉️ Vérifiez votre adresse email',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #1e3a8a; text-align: center;">✉️ Vérification d'email</h1>
              <div style="background-color: #f8fafc; padding: 25px; border-radius: 8px;">
                <p style="font-size: 16px; line-height: 1.6;">
                  Bonjour <strong>${user.name || 'Cher utilisateur'}</strong>,
                </p>
                <p style="font-size: 16px; line-height: 1.6;">
                  Veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous.
                </p>
                <div style="text-align: center; margin: 25px 0;">
                  <a href="${url}"
                     style="background-color: #1e3a8a; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                    Vérifier mon email
                  </a>
                </div>
              </div>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px; text-align: center;">
                Cet email a été envoyé automatiquement par Dragonfly Trimarans.
              </p>
            </div>
          `,
        });
        console.log(`✅ Email de vérification envoyé à ${user.email}`);
      } catch (error) {
        console.error(`❌ Erreur envoi email vérification à ${user.email}:`, error);
      }
    },
  },
  socialProviders: getSocialProviders(),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
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
