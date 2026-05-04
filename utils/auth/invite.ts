import * as nodemailer from 'nodemailer';
import crypto from 'crypto';
import prisma from '../prisma/client';
import { dragonflyModels, currencies, countries, boatConditions } from '../constants';
import { normalizeImageUrls } from '../image-urls';
import { formatPriceNumber } from '../format-price';

export interface BoatEmailData {
  id: string;
  model: string;
  price: number;
  currency: string;
  country: string;
  condition: string | null;
  description: string;
  photos: string[];
  specifications: string[];
}

function resolveLabel<T extends { key: string; label: string }>(list: readonly T[], key: string): string {
  return list.find((item) => item.key === key)?.label ?? key;
}

function buildBoatCardHtml(boat: BoatEmailData, baseUrl: string): string {
  const modelLabel = resolveLabel(dragonflyModels as any, boat.model);
  const countryLabel = resolveLabel(countries as any, boat.country);
  const currencySymbol = currencies.find((c) => c.key === boat.currency)?.symbol ?? boat.currency;
  const conditionLabel = boat.condition ? resolveLabel(boatConditions as any, boat.condition) : null;

  const normalizedPhotos = normalizeImageUrls(boat.photos, boat.id);
  const imageUrl = normalizedPhotos[0] ?? null;

  const imageHtml = imageUrl
    ? `<img src="${imageUrl}" alt="${modelLabel}" width="560" style="width: 100%; max-width: 560px; height: 240px; object-fit: cover; display: block;" />`
    : `<div style="width: 100%; height: 180px; background-color: #ECEFF5; text-align: center; line-height: 180px;">
         <span style="color: #A4B4BB; font-size: 14px;">No photo available</span>
       </div>`;

  const conditionHtml = conditionLabel
    ? `<div style="display: inline-block; padding: 4px 12px; background-color: #e6f3f3; color: #58A4A7; border-radius: 6px; font-size: 13px; font-weight: 500; margin-bottom: 16px;">${conditionLabel}</div>`
    : '';

  const descTruncated = boat.description.length > 300
    ? boat.description.slice(0, 300) + '…'
    : boat.description;

  const specsHtml = boat.specifications.length > 0
    ? `<div style="margin-bottom: 20px;">
        ${boat.specifications.map(
          (s) => `<span style="display: inline-block; padding: 4px 10px; background-color: #ECEFF5; color: #235B68; border-radius: 6px; font-size: 13px; margin: 3px 4px 3px 0;">${s}</span>`
        ).join('')}
       </div>`
    : '';

  return `
    <div style="border: 1px solid #CCD5DB; border-radius: 12px; overflow: hidden; margin-top: 32px;">
      ${imageHtml}
      <div style="padding: 24px; background-color: #FDFDFD;">
        <div style="display: inline-block; padding: 6px 12px; background-color: #235B68; color: #FDFDFD; border-radius: 8px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px;">
          ${countryLabel}
        </div>
        <div style="color: #58A4A7; font-size: 28px; font-weight: 700; line-height: 1.1; margin-bottom: 10px;">
          ${modelLabel}
        </div>
        <div style="color: #235B68; font-size: 22px; font-weight: 500; margin-bottom: 16px;">
          ${formatPriceNumber(boat.price, boat.currency)} ${currencySymbol}
        </div>
        ${conditionHtml}
        <div style="height: 1px; background-color: #ECEFF5; margin: 16px 0;"></div>
        <p style="color: #26282A; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
          ${descTruncated}
        </p>
        ${specsHtml}
        <a href="${baseUrl}/boat/${boat.id}" style="color: #58A4A7; font-size: 14px; font-weight: 600; text-decoration: none;">
          View my listing &rarr;
        </a>
      </div>
    </div>
  `;
}

export async function sendInvitationEmail(email: string, boats: BoatEmailData[]): Promise<void> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.error('❌ SMTP non configuré — invitation email non envoyé');
    return;
  }

  const normalized = email.toLowerCase().trim();
  const baseUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3000';

  const user = await prisma.user.findUnique({
    where: { email: normalized },
    select: { id: true, name: true },
  });

  if (!user) {
    console.error(`❌ Cannot send invitation: user ${normalized} not found`);
    return;
  }

  // Match Better Auth's reset-password token format:
  //   identifier = "reset-password:<token>"
  //   value      = user.id
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.verification.create({
    data: {
      identifier: `reset-password:${token}`,
      value: user.id,
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const activateUrl = `${baseUrl}/reset-password?token=${token}`;

  const firstName = user?.name
    ? user.name.charAt(0).toUpperCase() + user.name.slice(1)
    : normalized;

  const boatCardsHtml = boats.map((b) => buildBoatCardHtml(b, baseUrl)).join('');

  const listingsLabel = boats.length > 1 ? 'Your listings' : 'Your listing';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FDFDFD; color: #26282A;">

      <!-- Header -->
      <div style="background-color: #235B68; padding: 28px 24px; text-align: center; border-radius: 12px 12px 0 0;">
        <img src="${baseUrl}/logo-white.png" alt="Dragonfly Trimarans" width="130" height="60"
             style="display: inline-block; max-width: 130px; height: auto;" />
      </div>

      <!-- Body -->
      <div style="padding: 32px 28px;">

        <h1 style="color: #235B68; text-align: center; font-size: 22px; font-weight: 700; margin: 0 0 28px; line-height: 1.3;">
          Your listing is now live on the new Dragonfly Trimarans platform
        </h1>

        <div style="background-color: #ECEFF5; padding: 28px; border-radius: 12px;">
          <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px; color: #26282A;">
            Hello <strong>${firstName}</strong>,
          </p>
          <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px; color: #26282A;">
            The Dragonfly Trimarans User Forum has a new home. We've upgraded our marketplace to make it easier to buy and sell Dragonfly trimarans — and your listing has already been transferred over.
          </p>
          <p style="font-size: 16px; line-height: 1.6; margin: 0 0 24px; color: #26282A;">
            To manage your listing, update its details, or renew it when the time comes, simply create your password below. Your account is ready and waiting for you.
          </p>

          <p style="font-size: 15px; line-height: 1.6; margin: 0 0 20px; color: #26282A; text-align: center;">
            Your login email is this address: <strong>${normalized}</strong><br>
            Simply create your password to get started.
          </p>

          <div style="text-align: center; margin: 0 0 20px;">
            <a href="${activateUrl}"
               style="background-color: #58A4A7; color: #FDFDFD; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
              Activate my account
            </a>
          </div>
          <p style="text-align: center; margin: 0 0 20px;">
            <a href="${activateUrl}" style="color: #A4B4BB; font-size: 12px; word-break: break-all;">${activateUrl}</a>
          </p>

          <p style="color: #A4B4BB; font-size: 14px; margin: 0;">
            This link expires in 7 days. If you don't activate your account, your listing will remain visible but you won't be able to manage it online.
          </p>
        </div>

        <div style="margin-top: 40px;">
          <h2 style="color: #235B68; font-size: 18px; font-weight: 700; margin-bottom: 4px;">
            ${listingsLabel}
          </h2>
          ${boatCardsHtml}
        </div>

      </div>

      <!-- Footer -->
      <div style="background-color: #26282A; padding: 36px 24px; border-radius: 0 0 12px 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <img src="${baseUrl}/logo-white.png" alt="Dragonfly Trimarans" width="100" height="46"
               style="display: inline-block; max-width: 100px; height: auto; opacity: 0.85;" />
        </div>
        <div style="text-align: center; margin-bottom: 20px;">
          <a href="${baseUrl}" style="color: #A4B4BB; font-size: 13px; text-decoration: none; margin: 0 10px;">Home</a>
          <a href="${baseUrl}/forsale" style="color: #A4B4BB; font-size: 13px; text-decoration: none; margin: 0 10px;">For sale</a>
          <a href="${baseUrl}/forum" style="color: #A4B4BB; font-size: 13px; text-decoration: none; margin: 0 10px;">Forum</a>
          <a href="${baseUrl}/contact" style="color: #A4B4BB; font-size: 13px; text-decoration: none; margin: 0 10px;">Contact</a>
          <a href="${baseUrl}/privacy" style="color: #A4B4BB; font-size: 13px; text-decoration: none; margin: 0 10px;">Privacy</a>
        </div>
        <p style="color: #CCD5DB; font-size: 12px; text-align: center; margin: 0 0 12px;">
          You received this because your listing was transferred from the Dragonfly Trimarans User Forum.<br>
          Questions? <a href="mailto:administrator@dragonfly-trimarans.org" style="color: #58A4A7; text-decoration: none;">administrator@dragonfly-trimarans.org</a>
        </p>
        <p style="color: #A4B4BB; font-size: 11px; text-align: center; margin: 0;">
          All rights reserved by Dragonfly Trimarans Marketplace &nbsp;·&nbsp; © 2026 Dragonfly
        </p>
      </div>

    </div>
  `;

  const text = [
    `Hello ${firstName},`,
    '',
    `The Dragonfly Trimarans User Forum has a new home. We've upgraded our marketplace to make it easier to buy and sell Dragonfly trimarans — and your listing has already been transferred over.`,
    '',
    `To manage your listing, update its details, or renew it when the time comes, simply create your password below. Your account is ready and waiting for you.`,
    '',
    `Activate my account: ${activateUrl}`,
    '',
    `This link expires in 7 days. If you don't activate your account, your listing will remain visible but you won't be able to manage it online.`,
    '',
    `— The Dragonfly Trimarans team`,
    `This email was sent automatically. If you have any questions, contact us at administrator@dragonfly-trimarans.org.`,
  ].join('\n');

  const transporter = nodemailer.createTransport({
    host: 'mail.infomaniak.com',
    port: 587,
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });

  try {
    await transporter.sendMail({
      from: `"Dragonfly Trimarans" <${process.env.SMTP_USER}>`,
      replyTo: 'administrator@dragonfly-trimarans.org',
      to: normalized,
      subject: 'Dragonfly Trimarans User Forum — Your listing is now on the new platform',
      html,
      text,
    });

    if (user?.id) {
      await prisma.email_log.create({
        data: {
          type: 'invitation',
          userId: user.id,
          email: normalized,
        },
      });
    }

    console.log(`✅ Invitation email sent to ${normalized}`);
  } catch (error) {
    console.error(`❌ Failed to send invitation email to ${normalized}:`, error);
  }
}
