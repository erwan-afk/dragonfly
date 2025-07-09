'use client';

import Button from '@/components/ui/Button/Button';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

type OAuthProviders = {
  name: string;
  displayName: string;
  signupDisplayName: string;
};

export default function OauthSignIn() {
  const pathname = usePathname();
  const isSignupPage = pathname?.includes('/signup');

  const oAuthProviders: OAuthProviders[] = [
    {
      name: 'google',
      displayName: 'Continue with Google',
      signupDisplayName: 'Sign up with Google'
    }
  ];
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const provider = formData.get('provider') as string;

    try {
      console.log(`🚀 Starting ${provider} OAuth authentication...`);

      if (provider === 'google') {
        // Use Better Auth's Google OAuth - works for both signin and signup
        // Better Auth automatically handles new user creation for OAuth
        await authClient.signIn.social({
          provider: 'google',
          callbackURL: '/account' // Redirect after successful authentication
        });
      }
    } catch (error) {
      console.error(`❌ Error during ${provider} OAuth:`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Return null if no providers are available
  if (oAuthProviders.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      {oAuthProviders.map((provider) => (
        <form
          key={provider.name}
          className="pb-2"
          onSubmit={(e) => handleSubmit(e)}
        >
          <input type="hidden" name="provider" value={provider.name} />
          <Button
            type="submit"
            text={
              isSignupPage ? provider.signupDisplayName : provider.displayName
            }
            loading={isSubmitting}
            icon={'google'}
            anim_disabled
            bgColor="bg-fullwhite"
            textColor="text-oceanblue"
            fullwidth
            lowercase
          ></Button>
        </form>
      ))}
    </div>
  );
}
