import { auth } from "@/utils/auth/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { createRateLimiter, checkRateLimit } from "@/utils/rate-limit";
import { logAuthEvent, getClientIP, type AuthEventType } from "@/utils/auth-events";

// Force dynamic rendering - don't try to statically generate this route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Rate limiters for auth endpoints (per IP)
const signinLimiter = createRateLimiter('auth_signin', 10, 900); // 10 per 15 min
const signupLimiter = createRateLimiter('auth_signup', 5, 900);  // 5 per 15 min
const forgotPasswordLimiter = createRateLimiter('auth_forgot_password', 3, 900); // 3 per 15 min

function classify(path: string): AuthEventType | null {
  if (path.startsWith('/sign-in/social')) return 'oauth_start';
  if (path.startsWith('/callback/')) return 'oauth_callback';
  if (path.startsWith('/sign-in')) return 'signin';
  if (path.startsWith('/sign-up')) return 'signup';
  if (path.startsWith('/forget-password') || path.startsWith('/forgot-password') || path.startsWith('/request-password-reset')) return 'reset_requested';
  if (path.startsWith('/reset-password')) return 'reset_completed';
  return null;
}

// Record the outcome of an auth request without ever touching credentials:
// only the email (when present) and the error code are kept.
async function recordAuthEvent(request: Request, response: Response, rateLimited = false) {
  try {
    const path = new URL(request.url).pathname.replace('/api/auth', '');
    const type = classify(path);
    if (!type) return;

    let email: string | null = null;
    if (request.method === 'POST') {
      try {
        const body = await request.json();
        if (typeof body?.email === 'string') email = body.email;
      } catch {}
    }

    let detail: string | null = null;
    if (rateLimited) {
      detail = 'rate_limited';
    } else if (response.status >= 400) {
      try {
        const body = await response.json();
        detail = body?.code || body?.message || body?.error || `HTTP ${response.status}`;
      } catch {
        detail = `HTTP ${response.status}`;
      }
    } else if (type === 'oauth_callback') {
      const location = response.headers.get('location') || '';
      if (/[?&]error=/.test(location)) detail = location.split('error=')[1]?.split('&')[0] || 'oauth_error';
    }

    await logAuthEvent({
      type: rateLimited ? 'rate_limited' : type,
      success: !detail,
      email,
      detail: rateLimited ? `${type}: rate_limited` : detail,
      request,
    });
  } catch (error) {
    console.error('recordAuthEvent failed:', error);
  }
}

async function applyRateLimit(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/auth', '');
  const ip = getClientIP(request);

  if (path.includes('/sign-in')) {
    const rl = await checkRateLimit(signinLimiter, ip);
    if (rl) return new Response(JSON.stringify({ error: 'Too many login attempts. Please try again later.' }), { status: 429, headers: { 'Content-Type': 'application/json' } });
  }
  if (path.includes('/sign-up')) {
    const rl = await checkRateLimit(signupLimiter, ip);
    if (rl) return new Response(JSON.stringify({ error: 'Too many signup attempts. Please try again later.' }), { status: 429, headers: { 'Content-Type': 'application/json' } });
  }
  if (path.includes('/forget-password') || path.includes('/forgot-password')) {
    const rl = await checkRateLimit(forgotPasswordLimiter, ip);
    if (rl) return new Response(JSON.stringify({ error: 'Too many password reset attempts. Please try again later.' }), { status: 429, headers: { 'Content-Type': 'application/json' } });
  }

  return null;
}

const createHandler = () => {
  try {
    const authHandler = toNextJsHandler(auth);

    const wrapHandler = (originalHandler: (request: Request) => Promise<Response>) => {
      return async (request: Request) => {
        try {
          // Apply rate limiting before passing to Better Auth
          // Clone before the handler consumes the body, so the event log can read it
          const requestCopy = request.clone();

          const rateLimited = await applyRateLimit(request);
          if (rateLimited) {
            void recordAuthEvent(requestCopy, rateLimited.clone(), true);
            return rateLimited;
          }

          const response = await originalHandler(request);
          void recordAuthEvent(requestCopy, response.clone());
          return response;
        } catch (error) {
          console.error('Better Auth error:', error);
          return new Response(
            JSON.stringify({ error: "Authentication request failed" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      };
    };

    return {
      GET: wrapHandler(authHandler.GET),
      POST: wrapHandler(authHandler.POST)
    };
  } catch (error) {
    console.error("Error creating Better Auth handler:", error);
    const fallbackHandler = async () => {
      return new Response(
        JSON.stringify({ error: "Authentication service temporarily unavailable" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    };

    return { GET: fallbackHandler, POST: fallbackHandler };
  }
};

const handler = createHandler();

export const GET = handler.GET;
export const POST = handler.POST;
