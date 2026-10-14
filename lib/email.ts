import nodemailer from 'nodemailer';
import { recordEmail } from '@/utils/email-tracking';
import {
  EMAIL_BASE_URL,
  esc,
  panel,
  paragraph,
  renderEmail,
  renderText
} from '@/utils/email-layout';

const transporter = nodemailer.createTransport({
  host: 'mail.infomaniak.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string,
  meta?: { type: string; userId?: string | null; boatId?: string | null }
): Promise<boolean> {
  try {
    const info = await transporter.sendMail({
      from: `"3Hulls" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text:
        text ||
        html
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
    });
    await recordEmail({
      type: meta?.type ?? 'generic',
      to,
      subject,
      userId: meta?.userId,
      boatId: meta?.boatId,
      info
    });
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error);
    await recordEmail({
      type: meta?.type ?? 'generic',
      to,
      subject,
      userId: meta?.userId,
      boatId: meta?.boatId,
      error
    });
    return false;
  }
}

export function buildNewMessageEmail(params: {
  recipientName: string;
  senderName: string;
  boatModel: string;
  conversationId: string;
}): { subject: string; html: string; text: string } {
  const { recipientName, senderName, boatModel, conversationId } = params;
  const link = `${EMAIL_BASE_URL}/messages/${conversationId}`;
  const subject = `New message about your listing "${boatModel}"`;
  const reason =
    'You are receiving this email because someone contacted you about your listing on 3Hulls.';
  const html = renderEmail({
    preheader: `${senderName} is interested in your ${boatModel}.`,
    eyebrow: 'New message',
    title: 'A buyer wrote to you',
    content:
      paragraph(`Hello ${esc(recipientName)},`) +
      paragraph(
        `<strong>${esc(senderName)}</strong> sent you a message about the <strong>${esc(boatModel)}</strong>. Replying quickly is the best way to turn an enquiry into a sale.`
      ),
    cta: { label: 'Reply in Messages', url: link },
    reason
  });
  const text = renderText({
    greeting: `Hello ${recipientName},`,
    lines: [
      `${senderName} sent you a message about the ${boatModel}. Replying quickly is the best way to turn an enquiry into a sale.`
    ],
    cta: { label: 'Reply in Messages', url: link },
    reason
  });
  return { subject, html, text };
}

export function buildReportEmail(params: {
  reporterName: string;
  reporterEmail: string;
  reportedName: string;
  boatModel: string | null;
  reason: string;
  conversationId: string;
}): { subject: string; html: string; text: string } {
  const {
    reporterName,
    reporterEmail,
    reportedName,
    boatModel,
    reason,
    conversationId
  } = params;
  const link = `${EMAIL_BASE_URL}/messages/${conversationId}`;
  const subject = `[Messages] Conversation reported by ${reporterName}`;
  const footerReason =
    'Moderation notice: a conversation was reported on 3Hulls.';
  const html = renderEmail({
    preheader: `${reporterName} reported a conversation with ${reportedName}.`,
    eyebrow: 'Moderation',
    title: 'Conversation reported',
    content: panel(
      `<strong>Reported by:</strong> ${esc(reporterName)} (${esc(reporterEmail)})<br>` +
        `<strong>Reported user:</strong> ${esc(reportedName)}<br>` +
        (boatModel ? `<strong>Listing:</strong> ${esc(boatModel)}<br>` : '') +
        `<strong>Reason:</strong> ${esc(reason || 'Not specified')}`
    ),
    cta: { label: 'View conversation', url: link },
    reason: footerReason
  });
  const text = renderText({
    lines: [
      `Conversation reported by ${reporterName} (${reporterEmail})`,
      `Reported user: ${reportedName}`,
      ...(boatModel ? [`Listing: ${boatModel}`] : []),
      `Reason: ${reason || 'Not specified'}`
    ],
    cta: { label: 'View conversation', url: link },
    reason: footerReason
  });
  return { subject, html, text };
}
