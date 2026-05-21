/**
 * Server-side reCAPTCHA v3 validation utility.
 *
 * Uses Google's siteverify API to verify tokens obtained client-side
 * via `executeRecaptcha()` from `next-recaptcha-v3`.
 */

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

export async function validateRecaptcha(token: string): Promise<boolean> {
  if (process.env.NODE_ENV !== 'production') {
    console.warn('[recaptcha] dev mode — bypassing validation');
    return true;
  }

  if (!RECAPTCHA_SECRET_KEY) {
    console.error('RECAPTCHA_SECRET_KEY is not configured.');
    return false;
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', RECAPTCHA_SECRET_KEY);
    formData.append('response', token);

    const response = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });

    if (!response.ok) {
      console.error('reCAPTCHA verification request failed:', response.status);
      return false;
    }

    const data = await response.json() as {
      success: boolean;
      score: number;
      action: string;
      challenge_ts: string;
      hostname: string;
      'error-codes'?: string[];
    };

    if (!data.success) {
      console.warn(
        'reCAPTCHA verification unsuccessful:',
        data['error-codes']?.join(', ') ?? 'unknown error'
      );
      return false;
    }

    // reCAPTCHA v3 returns a score between 0.0 (bot) and 1.0 (human).
    // Default threshold of 0.5 is recommended by Google.
    const score = data.score;
    const threshold = 0.5;

    if (score < threshold) {
      console.warn(
        `reCAPTCHA score (${score}) below threshold (${threshold}) for action "${data.action}".`
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return false;
  }
}
