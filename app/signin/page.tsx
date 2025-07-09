import { redirect } from 'next/navigation';
import { getDefaultSignInView } from '@/utils/auth-helpers/settings';
import { cookies } from 'next/headers';

// Add metadata to help with loading
export const metadata = {
  title: 'Sign In - Redirecting...'
};

export default function SignIn() {
  const preferredSignInView =
    cookies().get('preferredSignInView')?.value || null;
  const defaultView = getDefaultSignInView(preferredSignInView);

  // Use permanent redirect for better performance
  redirect(`/signin/${defaultView}`);
}
