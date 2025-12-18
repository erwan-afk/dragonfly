import { type NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  // Désactivé temporairement pour éviter les erreurs Prisma
  // Laissons passer toutes les requêtes pour l'instant
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
}
