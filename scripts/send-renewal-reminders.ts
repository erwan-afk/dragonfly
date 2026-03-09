#!/usr/bin/env tsx

/**
 * Script d'envoi d'emails de renouvellement d'annonces
 * 3 types de rappels, chacun envoyé UNE SEULE FOIS grâce à la table email_logs
 * - reminder_7d : 7 jours avant expiration
 * - reminder_1d : 1 jour avant expiration
 * - expired : annonce expirée → notification + passage en inactive
 */

import { PrismaClient } from '@prisma/client';
import * as nodemailer from 'nodemailer';

const prisma = new PrismaClient();

const transporter = nodemailer.createTransport({
  host: 'mail.infomaniak.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dragonfly-livid.vercel.app';

function formatDateFr(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

// ─── Email Templates ────────────────────────────────────────────

function emailWrapper(content: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      ${content}
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
        Cet email a été envoyé automatiquement par Dragonfly Trimarans.
      </p>
    </div>
  `;
}

function template7d(userName: string, boatModel: string, expiryDate: Date, daysLeft: number, boatId: string): string {
  return emailWrapper(`
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #1e3a8a; margin: 0;">📅 Votre annonce expire dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}</h1>
    </div>
    <div style="background-color: #f8fafc; padding: 25px; border-radius: 8px;">
      <p style="font-size: 16px; line-height: 1.6;">
        Bonjour <strong>${userName}</strong>,
      </p>
      <p style="font-size: 16px; line-height: 1.6;">
        Votre annonce pour le <strong>${boatModel}</strong> expire le <strong>${formatDateFr(expiryDate)}</strong>.
      </p>
      <p style="font-size: 16px; line-height: 1.6;">
        Pensez à la renouveler pour continuer à recevoir des demandes d'acheteurs potentiels.
      </p>
      <div style="text-align: center; margin: 25px 0;">
        <a href="${SITE_URL}/list-boat?preference=Renewal&boatId=${boatId}"
           style="background-color: #3b82f6; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          🔄 Renouveler mon annonce
        </a>
      </div>
      <p style="color: #6b7280; font-size: 14px;">
        💡 Le renouvellement peut se faire à tout moment. Votre annonce reste visible jusqu'à expiration.
      </p>
    </div>
  `);
}

function template1d(userName: string, boatModel: string, expiryDate: Date, boatId: string): string {
  return emailWrapper(`
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #dc2626; margin: 0;">⚠️ Votre annonce expire demain !</h1>
    </div>
    <div style="background-color: #fef2f2; padding: 25px; border-radius: 8px;">
      <p style="font-size: 16px; line-height: 1.6;">
        Bonjour <strong>${userName}</strong>,
      </p>
      <p style="font-size: 16px; line-height: 1.6;">
        <strong>Dernier rappel :</strong> votre annonce pour le <strong>${boatModel}</strong> expire
        le <strong>${formatDateFr(expiryDate)}</strong>, soit <strong>demain</strong>.
      </p>
      <p style="font-size: 16px; line-height: 1.6;">
        Après cette date, votre annonce ne sera plus visible par les acheteurs.
      </p>
      <div style="text-align: center; margin: 25px 0;">
        <a href="${SITE_URL}/list-boat?preference=Renewal&boatId=${boatId}"
           style="background-color: #dc2626; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          🔄 Renouveler maintenant
        </a>
      </div>
    </div>
  `);
}

function templateExpired(userName: string, boatModel: string, expiryDate: Date, boatId: string): string {
  return emailWrapper(`
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #6b7280; margin: 0;">📋 Votre annonce a expiré</h1>
    </div>
    <div style="background-color: #f8fafc; padding: 25px; border-radius: 8px;">
      <p style="font-size: 16px; line-height: 1.6;">
        Bonjour <strong>${userName}</strong>,
      </p>
      <p style="font-size: 16px; line-height: 1.6;">
        Votre annonce pour le <strong>${boatModel}</strong> a expiré le <strong>${formatDateFr(expiryDate)}</strong>
        et n'est plus visible sur le site.
      </p>
      <p style="font-size: 16px; line-height: 1.6;">
        Vous pouvez la republier à tout moment si votre bateau est toujours en vente.
      </p>
      <div style="text-align: center; margin: 25px 0;">
        <a href="${SITE_URL}/list-boat?preference=Renewal&boatId=${boatId}"
           style="background-color: #1e3a8a; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          📋 Republier mon annonce
        </a>
      </div>
    </div>
  `);
}

// ─── Core Logic ─────────────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `"Dragonfly Trimarans" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error(`❌ Erreur envoi email à ${to}:`, error);
    return false;
  }
}

async function logEmail(type: string, boatId: string, userId: string, email: string): Promise<void> {
  await prisma.email_log.create({
    data: { type, boatId, userId, email },
  });
}

async function getAlreadySentSet(type: string, boatIds: string[]): Promise<Set<string>> {
  if (boatIds.length === 0) return new Set();
  const logs = await prisma.email_log.findMany({
    where: { type, boatId: { in: boatIds } },
    select: { boatId: true },
  });
  return new Set(logs.map(l => l.boatId).filter((id): id is string => id !== null));
}

async function processReminder7d(): Promise<{ sent: number; skipped: number }> {
  console.log('\n── Passe 1 : Rappels 7 jours ──');
  const now = new Date();
  const in6d = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);
  const in8d = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);

  const boats = await prisma.boat.findMany({
    where: {
      status: 'active',
      expiresAt: { gte: in6d, lte: in8d },
    },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  console.log(`   ${boats.length} annonces expirant dans 6-8 jours`);
  const alreadySent = await getAlreadySentSet('reminder_7d', boats.map(b => b.id));
  let sent = 0, skipped = 0;

  for (const boat of boats) {
    if (!boat.user?.email || !boat.expiresAt) { skipped++; continue; }
    if (alreadySent.has(boat.id)) {
      console.log(`   ⏭️  "${boat.model}" — déjà envoyé`);
      skipped++;
      continue;
    }

    const daysLeft = Math.ceil((boat.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const html = template7d(boat.user.name || 'Cher utilisateur', boat.model, boat.expiresAt, daysLeft, boat.id);
    const ok = await sendEmail(boat.user.email, `📅 Votre annonce "${boat.model}" expire dans ${daysLeft} jours`, html);

    if (ok) {
      await logEmail('reminder_7d', boat.id, boat.user.id, boat.user.email);
      console.log(`   ✅ "${boat.model}" → ${boat.user.email}`);
      sent++;
    }
    await new Promise(r => setTimeout(r, 500));
  }

  return { sent, skipped };
}

async function processReminder1d(): Promise<{ sent: number; skipped: number }> {
  console.log('\n── Passe 2 : Rappels 1 jour ──');
  const now = new Date();
  const in0d = now;
  const in2d = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

  const boats = await prisma.boat.findMany({
    where: {
      status: 'active',
      expiresAt: { gte: in0d, lte: in2d },
    },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  console.log(`   ${boats.length} annonces expirant dans 0-2 jours`);
  const alreadySent = await getAlreadySentSet('reminder_1d', boats.map(b => b.id));
  let sent = 0, skipped = 0;

  for (const boat of boats) {
    if (!boat.user?.email || !boat.expiresAt) { skipped++; continue; }
    if (alreadySent.has(boat.id)) {
      console.log(`   ⏭️  "${boat.model}" — déjà envoyé`);
      skipped++;
      continue;
    }

    const html = template1d(boat.user.name || 'Cher utilisateur', boat.model, boat.expiresAt, boat.id);
    const ok = await sendEmail(boat.user.email, `⚠️ Dernière chance : votre annonce "${boat.model}" expire demain !`, html);

    if (ok) {
      await logEmail('reminder_1d', boat.id, boat.user.id, boat.user.email);
      console.log(`   ✅ "${boat.model}" → ${boat.user.email}`);
      sent++;
    }
    await new Promise(r => setTimeout(r, 500));
  }

  return { sent, skipped };
}

async function processExpired(): Promise<{ sent: number; skipped: number; deactivated: number }> {
  console.log('\n── Passe 3 : Annonces expirées ──');
  const now = new Date();

  const boats = await prisma.boat.findMany({
    where: {
      status: 'active',
      expiresAt: { lt: now },
    },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  console.log(`   ${boats.length} annonces expirées encore actives`);
  const alreadySent = await getAlreadySentSet('expired', boats.map(b => b.id));
  let sent = 0, skipped = 0, deactivated = 0;

  for (const boat of boats) {
    // Toujours désactiver le bateau, même si l'email échoue
    await prisma.boat.update({
      where: { id: boat.id },
      data: { status: 'inactive' },
    });
    deactivated++;
    console.log(`   🔒 "${boat.model}" → inactive`);

    if (!boat.user?.email || !boat.expiresAt) { skipped++; continue; }
    if (alreadySent.has(boat.id)) {
      console.log(`   ⏭️  "${boat.model}" — email déjà envoyé`);
      skipped++;
      continue;
    }

    const html = templateExpired(boat.user.name || 'Cher utilisateur', boat.model, boat.expiresAt, boat.id);
    const ok = await sendEmail(boat.user.email, `📋 Votre annonce "${boat.model}" a expiré`, html);

    if (ok) {
      await logEmail('expired', boat.id, boat.user.id, boat.user.email);
      console.log(`   ✅ "${boat.model}" → ${boat.user.email}`);
      sent++;
    }
    await new Promise(r => setTimeout(r, 500));
  }

  return { sent, skipped, deactivated };
}

// ─── Main ───────────────────────────────────────────────────────

async function sendRenewalReminders() {
  console.log('🚀 Démarrage du script de rappels de renouvellement');
  console.log(`📅 ${formatDateFr(new Date())}`);

  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.error('❌ SMTP_USER ou SMTP_PASSWORD manquant');
    process.exit(1);
  }

  try {
    const r7 = await processReminder7d();
    const r1 = await processReminder1d();
    const exp = await processExpired();

    console.log('\n── Résumé ──');
    console.log(`   7 jours  : ${r7.sent} envoyés, ${r7.skipped} ignorés`);
    console.log(`   1 jour   : ${r1.sent} envoyés, ${r1.skipped} ignorés`);
    console.log(`   Expirés  : ${exp.sent} envoyés, ${exp.skipped} ignorés, ${exp.deactivated} désactivés`);
    console.log('✅ Terminé');
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// ─── Diagnostic ─────────────────────────────────────────────────

async function quickDiagnostic() {
  console.log('🔍 DIAGNOSTIC');
  console.log(`   SMTP_USER: ${process.env.SMTP_USER ? '✅' : '❌'}`);
  console.log(`   SMTP_PASSWORD: ${process.env.SMTP_PASSWORD ? '✅' : '❌'}`);
  console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅' : '❌'}`);
  console.log(`   SITE_URL: ${SITE_URL}`);

  try {
    await prisma.$connect();
    const active = await prisma.boat.count({ where: { status: 'active' } });
    const withExpiry = await prisma.boat.count({ where: { status: 'active', expiresAt: { not: null } } });
    const logCount = await prisma.email_log.count();
    console.log(`   DB: ✅ (${active} actifs, ${withExpiry} avec date expiration, ${logCount} emails loggés)`);
  } catch (e) {
    console.log(`   DB: ❌ ${e}`);
  }

  if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
    try {
      await transporter.verify();
      console.log('   SMTP: ✅');
    } catch (e) {
      console.log(`   SMTP: ❌ ${e}`);
    }
  }

  await prisma.$disconnect();
}

// ─── CLI ────────────────────────────────────────────────────────

if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--diagnostic') || args.includes('-d')) {
    quickDiagnostic().catch(console.error);
  } else {
    sendRenewalReminders().catch(console.error);
  }
}

export { sendRenewalReminders };
