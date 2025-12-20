import { NextRequest, NextResponse } from 'next/server';

async function validateRecaptcha(token: string): Promise<boolean> {
  try {
    const secret = process.env.RECAPTCHA_SECRET_KEY;
    if (!secret) {
      console.warn('RECAPTCHA_SECRET_KEY not configured, skipping validation');
      return true;
    }

    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret,
        response: token,
      }),
    });

    const data = await response.json();
    console.log(`reCAPTCHA v3 score: ${data.score}, success: ${data.success}`);
    return data.success && data.score >= 0.5;
  } catch (error) {
    console.error('reCAPTCHA validation error:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'reCAPTCHA token is required' },
        { status: 400 }
      );
    }

    const isValid = await validateRecaptcha(token);

    if (!isValid) {
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