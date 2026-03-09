import { NextRequest, NextResponse } from 'next/server';
import { generateCSRFToken, validateCSRFToken } from '@/utils/csrf';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const { sessionId, token, expiresAt } = await generateCSRFToken();

    return NextResponse.json({
      sessionId,
      token,
      expiresAt: expiresAt.getTime()
    });
  } catch (error) {
    console.error('Error generating CSRF token:', error);
    return NextResponse.json(
      { error: 'Unable to generate token' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId, token } = await request.json();

    if (!sessionId || !token) {
      return NextResponse.json(
        { error: 'Missing session ID or token' },
        { status: 400 }
      );
    }

    const isValid = await validateCSRFToken(sessionId, token);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error('Error validating CSRF token:', error);
    return NextResponse.json(
      { error: 'Unable to validate token' },
      { status: 500 }
    );
  }
}
