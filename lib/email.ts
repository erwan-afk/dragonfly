import nodemailer from 'nodemailer';

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
  text?: string
): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `"3Hulls" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    });
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error);
    return false;
  }
}

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

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://dragonfly-livid.vercel.app';

export function buildNewMessageEmail(params: {
  recipientName: string;
  senderName: string;
  boatModel: string;
  conversationId: string;
}): { subject: string; html: string; text: string } {
  const { recipientName, senderName, boatModel, conversationId } = params;
  const link = `${SITE_URL}/messages/${conversationId}`;
  const subject = `New message about your listing "${boatModel}"`;
  const html = emailWrapper(`
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #1e3a8a; margin: 0;">You have a new message</h1>
    </div>
    <div style="background-color: #f8fafc; padding: 25px; border-radius: 8px;">
      <p style="font-size: 16px; line-height: 1.6;">
        Hello <strong>${recipientName}</strong>,
      </p>
      <p style="font-size: 16px; line-height: 1.6;">
        <strong>${senderName}</strong> sent you a message about the <strong>${boatModel}</strong>.
      </p>
      <div style="text-align: center; margin: 25px 0;">
        <a href="${link}"
           style="background-color: #3b82f6; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Reply in Messages
        </a>
      </div>
    </div>
  `);
  const text = `Hello ${recipientName},\n\n${senderName} sent you a message about the ${boatModel}.\n\nReply here: ${link}\n\n3Hulls`;
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
  const link = `${SITE_URL}/messages/${conversationId}`;
  const subject = `[Messages] Conversation reported by ${reporterName}`;
  const html = emailWrapper(`
    <h2 style="color: #dc2626; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">
      Conversation reported
    </h2>
    <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Reported by:</strong> ${reporterName} (${reporterEmail})</p>
      <p style="margin: 5px 0;"><strong>Reported user:</strong> ${reportedName}</p>
      ${boatModel ? `<p style="margin: 5px 0;"><strong>Listing:</strong> ${boatModel}</p>` : ''}
      <p style="margin: 5px 0;"><strong>Reason:</strong> ${reason || 'Not specified'}</p>
    </div>
    <div style="text-align: center; margin: 25px 0;">
      <a href="${link}"
         style="background-color: #dc2626; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
        View conversation
      </a>
    </div>
  `);
  const text = `Conversation reported by ${reporterName} (${reporterEmail})\nReported user: ${reportedName}\n${boatModel ? `Listing: ${boatModel}\n` : ''}Reason: ${reason || 'Not specified'}\n\nView: ${link}`;
  return { subject, html, text };
}
