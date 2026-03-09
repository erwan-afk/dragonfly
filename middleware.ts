import { type NextRequest, NextResponse } from 'next/server';

// Routes that require authentication (cookie check only — full session
// validation still happens in the API routes / server components).
const PROTECTED_ROUTES = ['/account', '/list-boat', '/edit-listing', '/upgrade'];

// Routes that require admin role (checked server-side in the page)
const ADMIN_ROUTES = ['/admin'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route requires authentication
  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route));

  if (isProtected || isAdminRoute) {
    // Better Auth stores the session in a cookie named "better-auth.session_token"
    const sessionToken = request.cookies.get('better-auth.session_token');

    if (!sessionToken) {
      const signInUrl = new URL('/signin', request.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
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
