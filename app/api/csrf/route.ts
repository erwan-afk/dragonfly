import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { tokenStore } from '@/utils/csrf';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const ip = request.ip || 
              request.headers.get('x-forwarded-for') || 
              request.headers.get('x-real-ip') || 
              'unknown';

    // Generate session ID and CSRF token
    const sessionId = crypto.randomUUID();
    const token = crypto.randomBytes(32).toString('hex');
    const timestamp = Date.now();

    // Store token with session info
    tokenStore.set(sessionId, { token, timestamp, ip });

    return NextResponse.json({
      sessionId,
      token,
      expiresAt: timestamp + 3600000 // 1 hour
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

    const stored = tokenStore.get(sessionId);
    if (!stored) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Check if token matches
    if (stored.token !== token) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Check if token is expired
    const now = Date.now();
    if (now - stored.timestamp > 3600000) {
      tokenStore.delete(sessionId);
      return NextResponse.json(
        { error: 'Token expired' },
        { status: 401 }
      );
    }

    // Verify IP (optional additional security)
    const currentIp = request.ip || 
                     request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    if (stored.ip !== currentIp) {
      return NextResponse.json(
        { error: 'IP mismatch' },
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
