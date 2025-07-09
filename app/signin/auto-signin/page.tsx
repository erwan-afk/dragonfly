'use client';

import { useEffect } from 'react';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

export default function AutoSignInPage({
  searchParams
}: {
  searchParams: { email?: string; password?: string };
}) {
  const router = useRouter();

  useEffect(() => {
    const signInUser = async () => {
      const email = searchParams.email;
      const password = searchParams.password;

      if (!email || !password) {
        console.log('❌ Missing email or password for auto-signin');
        router.push('/signin/password_signin?error=Missing credentials');
        return;
      }

      try {
        console.log('🔍 Auto-signing in user:', email);

        const result = await authClient.signIn.email({
          email,
          password
        });

        if (result.error) {
          console.log('❌ Auto-signin failed:', result.error);
          router.push(
            `/signin/password_signin?error=${encodeURIComponent(result.error.message || 'Sign in failed')}`
          );
          return;
        }

        console.log('✅ Auto-signin successful, redirecting to account');
        router.push(
          '/account?status=Success!&status_description=Your account has been created. You are now signed in.'
        );
      } catch (error: any) {
        console.log('❌ Auto-signin error:', error.message);
        router.push(
          `/signin/password_signin?error=${encodeURIComponent(error.message)}`
        );
      }
    };

    signInUser();
  }, [searchParams, router]);

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <h2 className="text-2xl font-semibold text-gray-700">
          Signing you in...
        </h2>
        <p className="text-gray-500 mt-2">
          Please wait while we complete your sign up process.
        </p>
      </div>
    </div>
  );
}
