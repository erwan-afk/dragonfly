import { NextRequest, NextResponse } from 'next/server';
import { validateRecaptcha } from '@/utils/recaptcha';
import { logAuthEvent } from '@/utils/auth-events';

export async function POST(request: NextRequest) {
  try {
    const { token, email } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'reCAPTCHA token is required' },
        { status: 400 }
      );
    }

    const isValid = await validateRecaptcha(token);

    if (!isValid) {
      await logAuthEvent({
        type: 'captcha',
        success: false,
        email: typeof email === 'string' ? email : null,
        detail: 'reCAPTCHA verification failed',
        request
      });
      return NextResponse.json(
        { error: 'reCAPTCHA verification failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Captcha validation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
