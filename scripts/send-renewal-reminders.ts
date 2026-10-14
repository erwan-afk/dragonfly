#!/usr/bin/env tsx

/**
 * Script d'envoi d'emails de renouvellement d'annonces
 * 4 types de rappels, chacun envoyé UNE SEULE FOIS grâce à la table email_logs
 * - reminder_7d : 7 jours avant expiration
 * - reminder_1d : 1 jour avant expiration
 * - expired : annonce expirée → notification + passage en inactive
 * - pending_payment : annonce bloquée en pending (paiement jamais confirmé) depuis >2h
 */

import { PrismaClient } from '@prisma/client';
import * as nodemailer from 'nodemailer';
import { recordEmail } from '../utils/email-tracking';
import {
  EMAIL_BASE_URL as SITE_URL,
  esc,
  formatDate,
  listingCard,
  modelLabel,
  paragraph,
  renderEmail,
  renderText,
  type ListingSummary,
} from '../utils/email-layout';

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


// ─── Email content ──────────────────────────────────────────────
// Layout, colors and footer live in utils/email-layout.ts (shared by all emails).

type ReminderBoat = ListingSummary;
export interface BuiltEmail { subject: string; html: string; text: string }

const renewUrl = (boatId: string) => `${SITE_URL}/list-boat?preference=Renewal&boatId=${boatId}`;
const REASON = 'You are receiving this email because you have a listing on 3Hulls.';

export function buildReminder7d(userName: string, boat: ReminderBoat, expiryDate: Date, daysLeft: number): BuiltEmail {
  const label = modelLabel(boat.model);
  const when = formatDate(expiryDate);
  const days = `${daysLeft} day${daysLeft > 1 ? 's' : ''}`;
  return {
    subject: `Your ${label} listing expires in ${days}`,
    html: renderEmail({
      preheader: `Renew to keep your ${label} in front of buyers after ${when}.`,
      eyebrow: 'Listing reminder',
      title: `Your listing expires in ${days}`,
      content:
        paragraph(`Hello ${esc(userName)},`) +
        paragraph(`Your listing for the <strong>${esc(label)}</strong> stays visible to buyers until <strong>${when}</strong>.`) +
        listingCard(boat, { text: `Expires ${when}`, tone: 'warn' }) +
        paragraph('Renewing gives it another 3 months in front of Dragonfly enthusiasts. You can renew at any time: your listing stays visible until its expiry date.'),
      cta: { label: 'Renew my listing', url: renewUrl(boat.id) },
      secondary: { label: 'See renewal pricing', url: `${SITE_URL}/pricing` },
      reason: REASON,
    }),
    text: renderText({
      greeting: `Hello ${userName},`,
      lines: [
        `Your listing for the ${label} stays visible to buyers until ${when} (in ${days}).`,
        'Renewing gives it another 3 months in front of Dragonfly enthusiasts.',
      ],
      cta: { label: 'Renew my listing', url: renewUrl(boat.id) },
      reason: REASON,
    }),
  };
}

export function buildReminder1d(userName: string, boat: ReminderBoat, expiryDate: Date): BuiltEmail {
  const label = modelLabel(boat.model);
  const when = formatDate(expiryDate);
  return {
    subject: `Last call: your ${label} listing expires tomorrow`,
    html: renderEmail({
      preheader: `After ${when}, your ${label} will no longer be visible to buyers.`,
      eyebrow: 'Last reminder',
      title: 'Your listing expires tomorrow',
      content:
        paragraph(`Hello ${esc(userName)},`) +
        paragraph(`Your listing for the <strong>${esc(label)}</strong> expires on <strong>${when}</strong>, which is <strong>tomorrow</strong>. After that date it will no longer be visible to buyers.`) +
        listingCard(boat, { text: 'Expires tomorrow', tone: 'danger' }),
      cta: { label: 'Renew my listing', url: renewUrl(boat.id) },
      secondary: { label: 'See renewal pricing', url: `${SITE_URL}/pricing` },
      reason: REASON,
    }),
    text: renderText({
      greeting: `Hello ${userName},`,
      lines: [
        `Last reminder: your listing for the ${label} expires tomorrow (${when}).`,
        'After that date it will no longer be visible to buyers.',
      ],
      cta: { label: 'Renew my listing', url: renewUrl(boat.id) },
      reason: REASON,
    }),
  };
}

export function buildExpired(userName: string, boat: ReminderBoat, expiryDate: Date): BuiltEmail {
  const label = modelLabel(boat.model);
  const when = formatDate(expiryDate);
  return {
    subject: `Your ${label} listing has expired`,
    html: renderEmail({
      preheader: `Your ${label} is no longer visible on 3Hulls. Re-publish it in a few minutes.`,
      eyebrow: 'Listing expired',
      title: 'Your listing has expired',
      content:
        paragraph(`Hello ${esc(userName)},`) +
        paragraph(`Your listing for the <strong>${esc(label)}</strong> expired on <strong>${when}</strong> and is no longer visible on the site.`) +
        listingCard(boat, { text: `Expired on ${when}`, tone: 'muted' }) +
        paragraph('If your boat is still for sale, you can re-publish it in a couple of minutes and it will be back in front of buyers.'),
      cta: { label: 'Re-publish my listing', url: renewUrl(boat.id) },
      secondary: { label: 'See renewal pricing', url: `${SITE_URL}/pricing` },
      reason: REASON,
    }),
    text: renderText({
      greeting: `Hello ${userName},`,
      lines: [
        `Your listing for the ${label} expired on ${when} and is no longer visible on the site.`,
        'If your boat is still for sale, you can re-publish it in a couple of minutes.',
      ],
      cta: { label: 'Re-publish my listing', url: renewUrl(boat.id) },
      reason: REASON,
    }),
  };
}

export function buildPendingPayment(userName: string, boat: ReminderBoat): BuiltEmail {
  const label = modelLabel(boat.model);
  const url = `${SITE_URL}/resume-payment/${boat.id}`;
  return {
    subject: `One step left to publish your ${label}`,
    html: renderEmail({
      preheader: `Your ${label} is ready. Finish your payment to make it visible to buyers.`,
      eyebrow: 'Almost live',
      title: 'One step left to publish your listing',
      content:
        paragraph(`Hello ${esc(userName)},`) +
        paragraph(`Your listing for the <strong>${esc(label)}</strong> is all set, but the payment was never completed, so buyers can't see it yet.`) +
        listingCard(boat, { text: 'Awaiting payment', tone: 'info' }) +
        paragraph('Finish your payment and it goes live straight away.'),
      cta: { label: 'Finish my payment', url },
      reason: REASON,
    }),
    text: renderText({
      greeting: `Hello ${userName},`,
      lines: [
        `Your listing for the ${label} is all set, but the payment was never completed, so buyers can't see it yet.`,
        'Finish your payment and it goes live straight away.',
      ],
      cta: { label: 'Finish my payment', url },
      reason: REASON,
    }),
  };
}

// ─── Core Logic ─────────────────────────────────────────────────

async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text: string,
  meta: { type: string; userId: string; boatId: string }
): Promise<boolean> {
  try {
    const info = await transporter.sendMail({
      from: `"3Hulls" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text,
    });
    await recordEmail({ ...meta, to, subject, info }, prisma);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error);
    await recordEmail({ ...meta, to, subject, error }, prisma);
    return false;
  }
}

async function logEmail(type: string, boatId: string, userId: string, email: string): Promise<void> {
  await prisma.email_log.create({
    data: { type, boatId, userId, email },
  });
}

/** What a dry run would do, with masked recipients (safe to return from the API). */
export interface PlannedEmail { type: string; model: string; boatId: string; to: string }
let dryRunPlan: PlannedEmail[] = [];

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  return `${local.slice(0, 1)}***@${domain}`;
}

function planEmail(type: string, boat: { id: string; model: string }, email: string): void {
  console.log(`   🧪 [dry-run] would send ${type} to ${maskEmail(email)} for "${boat.model}" (${boat.id})`);
  dryRunPlan.push({ type, model: boat.model, boatId: boat.id, to: maskEmail(email) });
}

async function getAlreadySentSet(type: string, boatIds: string[]): Promise<Set<string>> {
  if (boatIds.length === 0) return new Set();
  const logs = await prisma.email_log.findMany({
    where: { type, boatId: { in: boatIds } },
    select: { boatId: true },
  });
  return new Set(logs.map(l => l.boatId).filter((id): id is string => id !== null));
}

async function processReminder7d(dryRun: boolean): Promise<{ sent: number; skipped: number }> {
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

    if (dryRun) {
      planEmail('reminder_7d', boat, boat.user.email);
      sent++;
      continue;
    }

    const daysLeft = Math.ceil((boat.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const mail = buildReminder7d(boat.user.name || 'there', boat, boat.expiresAt, daysLeft);
    const ok = await sendEmail(boat.user.email, mail.subject, mail.html, mail.text, { type: 'reminder_7d', userId: boat.user.id, boatId: boat.id });

    if (ok) {
      await logEmail('reminder_7d', boat.id, boat.user.id, boat.user.email);
      console.log(`   ✅ "${boat.model}" → ${boat.user.email}`);
      sent++;
    }
    await new Promise(r => setTimeout(r, 500));
  }

  return { sent, skipped };
}

async function processReminder1d(dryRun: boolean): Promise<{ sent: number; skipped: number }> {
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

    if (dryRun) {
      planEmail('reminder_1d', boat, boat.user.email);
      sent++;
      continue;
    }

    const mail = buildReminder1d(boat.user.name || 'there', boat, boat.expiresAt);
    const ok = await sendEmail(boat.user.email, mail.subject, mail.html, mail.text, { type: 'reminder_1d', userId: boat.user.id, boatId: boat.id });

    if (ok) {
      await logEmail('reminder_1d', boat.id, boat.user.id, boat.user.email);
      console.log(`   ✅ "${boat.model}" → ${boat.user.email}`);
      sent++;
    }
    await new Promise(r => setTimeout(r, 500));
  }

  return { sent, skipped };
}

async function processExpired(dryRun: boolean): Promise<{ sent: number; skipped: number; deactivated: number }> {
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
    if (dryRun) {
      console.log(`   🧪 [dry-run] would deactivate "${boat.model}" (${boat.id}), expired ${boat.expiresAt?.toISOString().slice(0, 10)}`);
      deactivated++;
      if (boat.user?.email && !alreadySent.has(boat.id)) planEmail('expired', boat, boat.user.email);
      sent++;
      continue;
    }

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

    const mail = buildExpired(boat.user.name || 'there', boat, boat.expiresAt);
    const ok = await sendEmail(boat.user.email, mail.subject, mail.html, mail.text, { type: 'expired', userId: boat.user.id, boatId: boat.id });

    if (ok) {
      await logEmail('expired', boat.id, boat.user.id, boat.user.email);
      console.log(`   ✅ "${boat.model}" → ${boat.user.email}`);
      sent++;
    }
    await new Promise(r => setTimeout(r, 500));
  }

  return { sent, skipped, deactivated };
}

async function processPendingPayment(dryRun: boolean): Promise<{ sent: number; skipped: number }> {
  console.log('\n── Pass 4: Pending payment (abandoned checkout) ──');
  const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000);

  const boats = await prisma.boat.findMany({
    where: {
      status: 'pending',
      createdAt: { lt: cutoff },
    },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  console.log(`   ${boats.length} listings pending for more than 2h`);
  const alreadySent = await getAlreadySentSet('pending_payment', boats.map(b => b.id));
  let sent = 0, skipped = 0;

  for (const boat of boats) {
    if (!boat.user?.email) { skipped++; continue; }
    if (alreadySent.has(boat.id)) {
      console.log(`   ⏭️  "${boat.model}" — already sent`);
      skipped++;
      continue;
    }

    if (dryRun) {
      planEmail('pending_payment', boat, boat.user.email);
      sent++;
      continue;
    }

    const mail = buildPendingPayment(boat.user.name || 'there', boat);
    const ok = await sendEmail(boat.user.email, mail.subject, mail.html, mail.text, { type: 'pending_payment', userId: boat.user.id, boatId: boat.id });

    if (ok) {
      await logEmail('pending_payment', boat.id, boat.user.id, boat.user.email);
      console.log(`   ✅ "${boat.model}" → ${boat.user.email}`);
      sent++;
    }
    await new Promise(r => setTimeout(r, 500));
  }

  return { sent, skipped };
}

// ─── Main ───────────────────────────────────────────────────────

async function sendRenewalReminders(dryRun: boolean = false) {
  console.log('🚀 Starting renewal reminder script');
  console.log(`📅 ${formatDate(new Date())}`);
  if (dryRun) console.log('🧪 Dry-run mode: nothing is sent, no listing is modified');
  dryRunPlan = [];

  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.error('❌ SMTP_USER or SMTP_PASSWORD missing');
    process.exit(1);
  }

  try {
    const r7 = await processReminder7d(dryRun);
    const r1 = await processReminder1d(dryRun);
    const exp = await processExpired(dryRun);
    const pend = await processPendingPayment(dryRun);

    console.log('\n── Summary ──');
    console.log(`   7 days  : ${r7.sent} sent, ${r7.skipped} skipped`);
    console.log(`   1 day   : ${r1.sent} sent, ${r1.skipped} skipped`);
    console.log(`   Expired : ${exp.sent} sent, ${exp.skipped} skipped, ${exp.deactivated} deactivated`);
    console.log(`   Pending : ${pend.sent} sent, ${pend.skipped} skipped`);
    console.log('✅ Done');

    return {
      dryRun,
      reminder7d: r7,
      reminder1d: r1,
      expired: exp,
      pendingPayment: pend,
      planned: dryRun ? dryRunPlan : undefined,
    };
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
    sendRenewalReminders(args.includes('--dry-run')).catch(console.error);
  }
}

export { sendRenewalReminders };
