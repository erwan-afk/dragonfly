import { type NextRequest, NextResponse } from 'next/server';

// Routes that require authentication (cookie check only — full session
// validation still happens in the API routes / server components).
const PROTECTED_ROUTES = ['/account', '/list-boat', '/edit-listing', '/upgrade', '/messages'];

// Routes that require admin role (checked server-side in the page)
const ADMIN_ROUTES = ['/admin'];

// Auth only works on the canonical domain: the Better Auth client and the
// OAuth callbacks are pinned to it, and a cross-origin call from the legacy
// domain is blocked by CORS (sign-up / sign-in / reset fail silently).
const CANONICAL_HOST = '3hulls.com';
const LEGACY_HOSTS = ['dragonfly-trimarans.org', 'www.dragonfly-trimarans.org'];
const AUTH_PAGES = ['/signin', '/reset-password', '/auth'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const host = (
    request.headers.get('x-forwarded-host') ||
    request.headers.get('host') ||
    ''
  )
    .split(',')[0]
    .trim()
    .toLowerCase();

  if (
    LEGACY_HOSTS.includes(host) &&
    AUTH_PAGES.some((p) => pathname === p || pathname.startsWith(p + '/'))
  ) {
    return NextResponse.redirect(
      `https://${CANONICAL_HOST}${pathname}${request.nextUrl.search}`,
      308
    );
  }

  // Check if the route requires authentication
  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route));

  if (isProtected || isAdminRoute) {
    // Better Auth uses "__Secure-" prefix on HTTPS (production)
    const sessionToken =
      request.cookies.get('better-auth.session_token') ||
      request.cookies.get('__Secure-better-auth.session_token');

    if (!sessionToken) {
      const signInUrl = new URL('/signin', request.url);
      // Keep the query string: renewal links from emails carry ?preference=…&boatId=…
      signInUrl.searchParams.set('callbackUrl', pathname + request.nextUrl.search);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes — have their own auth checks)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
};
