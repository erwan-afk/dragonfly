'use client';

import Button from '@/components/ui/Button';
import Link from 'next/link';
import { signInWithEmail } from '@/utils/auth-helpers/server';
import { handleRequest } from '@/utils/auth-helpers/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Input from '@/components/ui/Input/Input';

// Define prop type with allowPassword boolean
interface EmailSignInProps {
  allowPassword: boolean;
  redirectMethod: string;
  disableButton?: boolean;
}

export default function EmailSignIn({
  allowPassword,
  redirectMethod,
  disableButton
}: EmailSignInProps) {
  const router = redirectMethod === 'client' ? useRouter() : null;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setIsSubmitting(true); // Disable the button while the request is being handled
    await handleRequest(e, signInWithEmail, router);
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col">
      <div className="flex flex-col space-y-1 mb-8">
        <h1 className="font-bold text-oceanblue text-40 tracking-wide">
          Sign in
        </h1>
        <p className="text-base text-darkgrey">Sign in with your email</p>
      </div>
      <form
        noValidate={true}
        className="mb-4"
        onSubmit={(e) => handleSubmit(e)}
      >
        <div className="grid gap-2">
          <div className="grid gap-1">
            <Input
              id="email"
              label="Email"
              placeholder="name@example.com"
              type="email"
              name="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
            />
          </div>
          <Button
            text="Sign in"
            type="submit"
            loading={isSubmitting}
            anim_disabled
          />
        </div>
      </form>
      {allowPassword && (
        <>
          <p>
            <Link href="/signin/password_signin" className="font-light text-sm">
              Sign in with email and password
            </Link>
          </p>
          <p>
            <Link href="/signin/signup" className="font-light text-sm">
              Don't have an account? Sign up
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
