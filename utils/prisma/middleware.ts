import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/utils/auth/auth';

export const updateSession = async (request: NextRequest) => {
  try {
    // Vérifier la session avec Better Auth
    const session = await auth.api.getSession({
      headers: request.headers
    });

    const pathname = request.nextUrl?.pathname || '';

    // Si pas de session pour des routes protégées, rediriger vers la page de connexion
    const protectedRoutes = ['/account', '/list-boat', '/admin'];
    const isProtectedRoute = protectedRoutes.some(route => 
      pathname.startsWith(route)
    );

    if (isProtectedRoute && !session) {
      return NextResponse.redirect(new URL('/signin', request.url));
    }

    return NextResponse.next();
  } catch (e) {
    console.error('Middleware error:', e);
    return NextResponse.next();
  }
};
