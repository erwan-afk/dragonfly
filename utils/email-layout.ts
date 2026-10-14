/**
 * Shared layout + building blocks for every transactional email, so that all
 * of them carry the 3Hulls identity (same logo lockup, colors, footer).
 *
 * Email clients support very little CSS: everything is inline, table based
 * and only uses web-safe fonts. The logo is a small PNG (SVG is stripped by
 * Gmail) served from /email/logo-white.png.
 */
import { dragonflyModels, currencies, countries } from './constants';
import { formatPriceNumber } from './format-price';
import { normalizeImageUrls } from './image-urls';
import { legalConfig } from './legal-config';

export const COLORS = {
  ocean: '#235B68',
  arctic: '#58A4A7',
  dark: '#26282A',
  light: '#ECEFF5',
  smoky: '#CCD5DB',
  stone: '#A4B4BB',
  white: '#FDFDFD'
} as const;

const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

export const EMAIL_BASE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://3hulls.com'
).replace(/\/$/, '');

export const SUPPORT_EMAIL = 'administrator@dragonfly-trimarans.org';

/** Escape user-controlled text before putting it in HTML. */
export function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

// ─── Building blocks ────────────────────────────────────────────

export function paragraph(html: string): string {
  return `<p style="margin: 0 0 18px; font-family: ${FONT}; font-size: 16px; line-height: 1.65; color: ${COLORS.dark};">${html}</p>`;
}

export function button(label: string, url: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 28px auto 8px;">
      <tr>
        <td align="center" bgcolor="${COLORS.ocean}" style="border-radius: 8px;">
          <a href="${url}" target="_blank" style="display: inline-block; padding: 15px 36px; font-family: ${FONT}; font-size: 16px; font-weight: bold; line-height: 1; color: #FFFFFF; text-decoration: none; border-radius: 8px;">${esc(label)}</a>
        </td>
      </tr>
    </table>`;
}

export function secondaryLink(label: string, url: string): string {
  return `<p style="margin: 14px 0 0; text-align: center; font-family: ${FONT}; font-size: 14px;"><a href="${url}" target="_blank" style="color: ${COLORS.ocean}; text-decoration: underline;">${esc(label)}</a></p>`;
}

export type PillTone = 'info' | 'warn' | 'danger' | 'muted';

const PILL: Record<PillTone, { bg: string; fg: string }> = {
  info: { bg: '#E3F1F1', fg: COLORS.ocean },
  warn: { bg: '#FDF1D8', fg: '#8A5A00' },
  danger: { bg: '#FBE4E2', fg: '#A32A22' },
  muted: { bg: COLORS.light, fg: '#5A6770' }
};

export function pill(text: string, tone: PillTone = 'info'): string {
  const c = PILL[tone];
  return `<span style="display: inline-block; padding: 5px 12px; border-radius: 999px; background-color: ${c.bg}; color: ${c.fg}; font-family: ${FONT}; font-size: 12px; font-weight: bold; letter-spacing: 0.04em; text-transform: uppercase;">${esc(text)}</span>`;
}

/** A soft panel to group related info (credentials, steps, a quote...). */
export function panel(html: string): string {
  return `<div style="margin: 0 0 22px; padding: 20px 22px; background-color: ${COLORS.light}; border-radius: 10px; font-family: ${FONT}; font-size: 15px; line-height: 1.6; color: ${COLORS.dark};">${html}</div>`;
}

export interface ListingSummary {
  id: string;
  model: string;
  price: number | { toString(): string };
  currency: string;
  country: string;
  photos: string[];
}

function resolveLabel<T extends { key: string; label: string }>(
  list: readonly T[],
  key: string
): string {
  return list.find((item) => item.key === key)?.label ?? key;
}

export function modelLabel(modelKey: string): string {
  return resolveLabel(dragonflyModels as any, modelKey);
}

/** Compact listing card: photo, model, price, country and a status pill. */
export function listingCard(
  boat: ListingSummary,
  status?: { text: string; tone: PillTone }
): string {
  const label = modelLabel(boat.model);
  const country = resolveLabel(countries as any, boat.country);
  const symbol =
    currencies.find((c) => c.key === boat.currency)?.symbol ?? boat.currency;
  const price = formatPriceNumber(Number(boat.price.toString()), boat.currency);
  const photo = normalizeImageUrls(boat.photos, boat.id)[0] ?? null;

  const image = photo
    ? `<img src="${esc(photo)}" alt="${esc(label)}" width="536" style="display: block; width: 100%; max-width: 536px; height: 220px; object-fit: cover; border: 0;" />`
    : `<div style="height: 120px; background-color: ${COLORS.light}; text-align: center; line-height: 120px; font-family: ${FONT}; font-size: 13px; color: ${COLORS.stone};">No photo</div>`;

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 24px; border: 1px solid ${COLORS.smoky}; border-radius: 12px; overflow: hidden; background-color: #FFFFFF;">
      <tr><td style="line-height: 0; font-size: 0;">${image}</td></tr>
      <tr>
        <td style="padding: 18px 22px 20px; font-family: ${FONT};">
          <div style="font-size: 12px; font-weight: bold; letter-spacing: 0.08em; text-transform: uppercase; color: ${COLORS.stone}; margin-bottom: 6px;">${esc(country)}</div>
          <div style="font-size: 24px; font-weight: bold; line-height: 1.15; color: ${COLORS.arctic}; margin-bottom: 6px;">${esc(label)}</div>
          <div style="font-size: 18px; color: ${COLORS.ocean}; margin-bottom: ${status ? '14px' : '0'};">${esc(price)} ${esc(symbol)}</div>
          ${status ? pill(status.text, status.tone) : ''}
        </td>
      </tr>
    </table>`;
}

// ─── Layout ─────────────────────────────────────────────────────

export interface EmailOptions {
  /** Hidden preview text shown next to the subject in the inbox. */
  preheader: string;
  /** Small uppercase label above the title. */
  eyebrow?: string;
  title: string;
  /** Body HTML, built with paragraph(), listingCard(), panel()... */
  content: string;
  cta?: { label: string; url: string };
  secondary?: { label: string; url: string };
  /** Why the recipient gets this email (footer). */
  reason: string;
}

const FOOTER_LINKS: Array<[string, string]> = [
  ['Home', EMAIL_BASE_URL],
  ['For sale', `${EMAIL_BASE_URL}/forsale`],
  ['Forum', `${EMAIL_BASE_URL}/forum`],
  ['Contact', `${EMAIL_BASE_URL}/contact`],
  ['Privacy', `${EMAIL_BASE_URL}/privacy`]
];

export function renderEmail(o: EmailOptions): string {
  const logo = `${EMAIL_BASE_URL}/email/logo-white.png`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>${esc(o.title)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${COLORS.light};">
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; color: transparent; mso-hide: all;">${esc(o.preheader)}${'&nbsp;&zwnj;'.repeat(40)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${COLORS.light}">
    <tr>
      <td align="center" style="padding: 28px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width: 100%; max-width: 600px;">

          <!-- Header -->
          <tr>
            <td align="center" bgcolor="${COLORS.ocean}" style="padding: 34px 24px 26px; border-radius: 14px 14px 0 0;">
              <a href="${EMAIL_BASE_URL}" target="_blank"><img src="${logo}" alt="3Hulls" width="260" style="display: block; width: 260px; max-width: 100%; height: auto; border: 0;" /></a>
              <div style="margin-top: 14px; font-family: ${FONT}; font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; color: ${COLORS.smoky};">The dedicated marketplace for Dragonfly trimarans</div>
            </td>
          </tr>
          <tr><td bgcolor="${COLORS.arctic}" height="4" style="height: 4px; line-height: 4px; font-size: 0;">&nbsp;</td></tr>

          <!-- Body -->
          <tr>
            <td bgcolor="${COLORS.white}" style="padding: 38px 32px 34px;">
              ${o.eyebrow ? `<div style="margin: 0 0 10px; font-family: ${FONT}; font-size: 12px; font-weight: bold; letter-spacing: 0.14em; text-transform: uppercase; color: ${COLORS.arctic};">${esc(o.eyebrow)}</div>` : ''}
              <h1 style="margin: 0 0 24px; font-family: ${FONT}; font-size: 26px; font-weight: bold; line-height: 1.25; color: ${COLORS.ocean};">${esc(o.title)}</h1>
              ${o.content}
              ${o.cta ? button(o.cta.label, o.cta.url) : ''}
              ${o.secondary ? secondaryLink(o.secondary.label, o.secondary.url) : ''}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td bgcolor="${COLORS.dark}" align="center" style="padding: 32px 28px; border-radius: 0 0 14px 14px;">
              <div style="margin-bottom: 18px; font-family: ${FONT}; font-size: 13px;">
                ${FOOTER_LINKS.map(
                  ([label, url]) =>
                    `<a href="${url}" target="_blank" style="color: ${COLORS.stone}; text-decoration: none; margin: 0 9px;">${label}</a>`
                ).join('')}
              </div>
              <div style="margin: 0 0 14px; font-family: ${FONT}; font-size: 12px; line-height: 1.6; color: ${COLORS.smoky};">
                ${esc(o.reason)}<br>
                Questions? Just reply, or write to <a href="mailto:${SUPPORT_EMAIL}" style="color: ${COLORS.arctic}; text-decoration: none;">${SUPPORT_EMAIL}</a>.
              </div>
              <div style="font-family: ${FONT}; font-size: 11px; line-height: 1.6; color: ${COLORS.stone};">
                3Hulls &middot; ${esc(legalConfig.entityName)}<br>
                ${esc(legalConfig.address)}
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Plain-text twin of an email, kept short and readable. */
export function renderText(o: {
  greeting?: string;
  lines: string[];
  cta?: { label: string; url: string };
  reason: string;
}): string {
  return [
    o.greeting,
    '',
    ...o.lines.flatMap((l) => [l, '']),
    o.cta ? `${o.cta.label}: ${o.cta.url}` : undefined,
    o.cta ? '' : undefined,
    o.reason,
    `Questions? Just reply to this email or write to ${SUPPORT_EMAIL}.`,
    '',
    `3Hulls — ${legalConfig.entityName}`,
    legalConfig.address
  ]
    .filter((l): l is string => l !== undefined)
    .join('\n');
}
