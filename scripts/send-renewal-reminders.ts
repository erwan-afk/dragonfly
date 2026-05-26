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

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
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
        This email was sent automatically by 3Hulls.
      </p>
    </div>
  `;
}

function template7d(userName: string, boatModel: string, expiryDate: Date, daysLeft: number, boatId: string): string {
  return emailWrapper(`
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #1e3a8a; margin: 0;">Your listing expires in ${daysLeft} day${daysLeft > 1 ? 's' : ''}</h1>
    </div>
    <div style="background-color: #f8fafc; padding: 25px; border-radius: 8px;">
      <p style="font-size: 16px; line-height: 1.6;">
        Hello <strong>${userName}</strong>,
      </p>
      <p style="font-size: 16px; line-height: 1.6;">
        Your listing for the <strong>${boatModel}</strong> expires on <strong>${formatDate(expiryDate)}</strong>.
      </p>
      <p style="font-size: 16px; line-height: 1.6;">
        Renew it to keep receiving enquiries from potential buyers.
      </p>
      <div style="text-align: center; margin: 25px 0;">
        <a href="${SITE_URL}/list-boat?preference=Renewal&boatId=${boatId}"
           style="background-color: #3b82f6; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Renew my listing
        </a>
      </div>
      <p style="color: #6b7280; font-size: 14px;">
        You can renew at any time. Your listing stays visible until it expires.
      </p>
    </div>
  `);
}

function template1d(userName: string, boatModel: string, expiryDate: Date, boatId: string): string {
  return emailWrapper(`
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #dc2626; margin: 0;">Your listing expires tomorrow!</h1>
    </div>
    <div style="background-color: #fef2f2; padding: 25px; border-radius: 8px;">
      <p style="font-size: 16px; line-height: 1.6;">
        Hello <strong>${userName}</strong>,
      </p>
      <p style="font-size: 16px; line-height: 1.6;">
        <strong>Last reminder:</strong> your listing for the <strong>${boatModel}</strong> expires
        on <strong>${formatDate(expiryDate)}</strong>, which is <strong>tomorrow</strong>.
      </p>
      <p style="font-size: 16px; line-height: 1.6;">
        After that date your listing will no longer be visible to buyers.
      </p>
      <div style="text-align: center; margin: 25px 0;">
        <a href="${SITE_URL}/list-boat?preference=Renewal&boatId=${boatId}"
           style="background-color: #dc2626; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Renew now
        </a>
      </div>
    </div>
  `);
}

function templateExpired(userName: string, boatModel: string, expiryDate: Date, boatId: string): string {
  return emailWrapper(`
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #6b7280; margin: 0;">Your listing has expired</h1>
    </div>
    <div style="background-color: #f8fafc; padding: 25px; border-radius: 8px;">
      <p style="font-size: 16px; line-height: 1.6;">
        Hello <strong>${userName}</strong>,
      </p>
      <p style="font-size: 16px; line-height: 1.6;">
        Your listing for the <strong>${boatModel}</strong> expired on <strong>${formatDate(expiryDate)}</strong>
        and is no longer visible on the site.
      </p>
      <p style="font-size: 16px; line-height: 1.6;">
        You can re-publish it at any time if your boat is still for sale.
      </p>
      <div style="text-align: center; margin: 25px 0;">
        <a href="${SITE_URL}/list-boat?preference=Renewal&boatId=${boatId}"
           style="background-color: #1e3a8a; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Re-publish my listing
        </a>
      </div>
    </div>
  `);
}

// ─── Core Logic ─────────────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string, text: string): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `"3Hulls" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text,
    });
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error);
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
  console.log('\n── Pass 1: 7-day reminders ──');
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

  console.log(`   ${boats.length} listings expiring in 6-8 days`);
  const alreadySent = await getAlreadySentSet('reminder_7d', boats.map(b => b.id));
  let sent = 0, skipped = 0;

  for (const boat of boats) {
    if (!boat.user?.email || !boat.expiresAt) { skipped++; continue; }
    if (alreadySent.has(boat.id)) {
      console.log(`   ⏭️  "${boat.model}" — already sent`);
      skipped++;
      continue;
    }

    const daysLeft = Math.ceil((boat.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const html = template7d(boat.user.name || 'there', boat.model, boat.expiresAt, daysLeft, boat.id);
    const text = `Hello ${boat.user.name || 'there'},\n\nYour listing for the ${boat.model} expires on ${formatDate(boat.expiresAt)} (in ${daysLeft} day${daysLeft > 1 ? 's' : ''}).\n\nRenew it here: ${SITE_URL}/list-boat?preference=Renewal&boatId=${boat.id}\n\n3Hulls`;
    const ok = await sendEmail(boat.user.email, `Your listing "${boat.model}" expires in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`, html, text);

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
  console.log('\n── Pass 2: 1-day reminders ──');
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

  console.log(`   ${boats.length} listings expiring in 0-2 days`);
  const alreadySent = await getAlreadySentSet('reminder_1d', boats.map(b => b.id));
  let sent = 0, skipped = 0;

  for (const boat of boats) {
    if (!boat.user?.email || !boat.expiresAt) { skipped++; continue; }
    if (alreadySent.has(boat.id)) {
      console.log(`   ⏭️  "${boat.model}" — already sent`);
      skipped++;
      continue;
    }

    const html = template1d(boat.user.name || 'there', boat.model, boat.expiresAt, boat.id);
    const text = `Hello ${boat.user.name || 'there'},\n\nLast reminder: your listing for the ${boat.model} expires tomorrow (${formatDate(boat.expiresAt)}).\n\nRenew it here: ${SITE_URL}/list-boat?preference=Renewal&boatId=${boat.id}\n\n3Hulls`;
    const ok = await sendEmail(boat.user.email, `Last chance: your listing "${boat.model}" expires tomorrow`, html, text);

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
  console.log('\n── Pass 3: Expired listings ──');
  const now = new Date();

  const boats = await prisma.boat.findMany({
    where: {
      status: 'active',
      expiresAt: { lt: now },
    },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  console.log(`   ${boats.length} expired listings still active`);
  const alreadySent = await getAlreadySentSet('expired', boats.map(b => b.id));
  let sent = 0, skipped = 0, deactivated = 0;

  for (const boat of boats) {
    await prisma.boat.update({
      where: { id: boat.id },
      data: { status: 'inactive' },
    });
    deactivated++;
    console.log(`   🔒 "${boat.model}" → inactive`);

    if (!boat.user?.email || !boat.expiresAt) { skipped++; continue; }
    if (alreadySent.has(boat.id)) {
      console.log(`   ⏭️  "${boat.model}" — email already sent`);
      skipped++;
      continue;
    }

    const html = templateExpired(boat.user.name || 'there', boat.model, boat.expiresAt, boat.id);
    const text = `Hello ${boat.user.name || 'there'},\n\nYour listing for the ${boat.model} expired on ${formatDate(boat.expiresAt)} and is no longer visible on the site.\n\nRe-publish it here: ${SITE_URL}/list-boat?preference=Renewal&boatId=${boat.id}\n\n3Hulls`;
    const ok = await sendEmail(boat.user.email, `Your listing "${boat.model}" has expired`, html, text);

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
  console.log('🚀 Starting renewal reminder script');
  console.log(`📅 ${formatDate(new Date())}`);

  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.error('❌ SMTP_USER or SMTP_PASSWORD missing');
    process.exit(1);
  }

  try {
    const r7 = await processReminder7d();
    const r1 = await processReminder1d();
    const exp = await processExpired();

    console.log('\n── Summary ──');
    console.log(`   7 days  : ${r7.sent} sent, ${r7.skipped} skipped`);
    console.log(`   1 day   : ${r1.sent} sent, ${r1.skipped} skipped`);
    console.log(`   Expired : ${exp.sent} sent, ${exp.skipped} skipped, ${exp.deactivated} deactivated`);
    console.log('✅ Done');
  } catch (error) {
    console.error('❌ Error:', error);
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
