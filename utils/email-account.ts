/**
 * Account-related transactional emails (password reset, email verification,
 * admin-triggered password reset), built on the shared 3Hulls email layout.
 */
import {
  EMAIL_BASE_URL,
  esc,
  panel,
  paragraph,
  renderEmail,
  renderText
} from './email-layout';

export interface BuiltEmail {
  subject: string;
  html: string;
  text: string;
}

export function buildPasswordResetEmail(
  name: string | null | undefined,
  url: string
): BuiltEmail {
  const who = name || 'there';
  const reason =
    'You are receiving this email because a password reset was requested for your 3Hulls account.';
  return {
    subject: 'Reset your password',
    html: renderEmail({
      preheader: 'Choose a new password for your 3Hulls account.',
      eyebrow: 'Account security',
      title: 'Reset your password',
      content:
        paragraph(`Hello ${esc(who)},`) +
        paragraph(
          'We received a request to reset the password of your 3Hulls account. Use the button below to choose a new one. The link is valid for 7 days.'
        ) +
        paragraph(
          "If you didn't ask for this, you can safely ignore this email: your password won't change."
        ),
      cta: { label: 'Choose a new password', url },
      reason
    }),
    text: renderText({
      greeting: `Hello ${who},`,
      lines: [
        'We received a request to reset the password of your 3Hulls account. Use the link below to choose a new one. It is valid for 7 days.',
        "If you didn't ask for this, you can safely ignore this email."
      ],
      cta: { label: 'Choose a new password', url },
      reason
    })
  };
}

export function buildVerificationEmail(
  name: string | null | undefined,
  url: string
): BuiltEmail {
  const who = name || 'there';
  const reason =
    'You are receiving this email because an account was created with this address on 3Hulls.';
  return {
    subject: 'Verify your email address',
    html: renderEmail({
      preheader: 'One click to confirm your email address.',
      eyebrow: 'Welcome aboard',
      title: 'Confirm your email address',
      content:
        paragraph(`Hello ${esc(who)},`) +
        paragraph(
          'Welcome to 3Hulls, the dedicated marketplace for Dragonfly trimarans. Please confirm your email address to finish setting up your account.'
        ),
      cta: { label: 'Verify my email', url },
      reason
    }),
    text: renderText({
      greeting: `Hello ${who},`,
      lines: [
        'Welcome to 3Hulls, the dedicated marketplace for Dragonfly trimarans. Please confirm your email address to finish setting up your account.'
      ],
      cta: { label: 'Verify my email', url },
      reason
    })
  };
}

export function buildAdminPasswordResetEmail(
  name: string | null | undefined,
  tempPassword: string
): BuiltEmail {
  const who = name || 'there';
  const signinUrl = `${EMAIL_BASE_URL}/signin`;
  const reason = 'An administrator reset the password of your 3Hulls account.';
  return {
    subject: 'Your password has been reset - 3Hulls',
    html: renderEmail({
      preheader: 'A temporary password is waiting for you inside.',
      eyebrow: 'Account security',
      title: 'Your password has been reset',
      content:
        paragraph(`Hello ${esc(who)},`) +
        paragraph(
          'An administrator has reset your password. Here is your temporary password:'
        ) +
        panel(
          `<div style="text-align: center; font-family: 'Courier New', Courier, monospace; font-size: 20px; font-weight: bold; letter-spacing: 0.08em; color: #235B68;">${esc(tempPassword)}</div>`
        ) +
        paragraph(
          'Sign in with it, then change it right away in your account settings.'
        ),
      cta: { label: 'Sign in', url: signinUrl },
      reason
    }),
    text: renderText({
      greeting: `Hello ${who},`,
      lines: [
        'An administrator has reset your password. Your temporary password is:',
        tempPassword,
        'Sign in with it, then change it right away in your account settings.'
      ],
      cta: { label: 'Sign in', url: signinUrl },
      reason
    })
  };
}
