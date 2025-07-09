import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getErrorRedirect, getStatusRedirect } from '@/utils/helpers';

export async function GET(request: NextRequest) {
  // Better Auth gère la réinitialisation de mot de passe différemment
  // Cette route peut être utilisée pour des redirections personnalisées
  const requestUrl = new URL(request.url);
  
  // Rediriger vers la page de mise à jour du mot de passe
  return NextResponse.redirect(
    getStatusRedirect(
      `${requestUrl.origin}/signin/update_password`,
      'Password reset',
      'Please enter your new password.'
    )
  );
}
