import { auth } from "@/utils/auth/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { createRateLimiter, checkRateLimit } from "@/utils/rate-limit";

// Force dynamic rendering - don't try to statically generate this route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Rate limiters for auth endpoints (per IP)
const signinLimiter = createRateLimiter('auth_signin', 10, 900); // 10 per 15 min
const signupLimiter = createRateLimiter('auth_signup', 5, 900);  // 5 per 15 min
const forgotPasswordLimiter = createRateLimiter('auth_forgot_password', 3, 900); // 3 per 15 min

function getClientIP(request: Request): string {
  const headers = new Headers(request.headers);
  return headers.get('cf-connecting-ip')
    || headers.get('x-real-ip')
    || headers.get('x-forwarded-for')?.split(',')[0].trim()
    || 'unknown';
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
          const rateLimited = await applyRateLimit(request);
          if (rateLimited) return rateLimited;

          return await originalHandler(request);
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
