'use client';

import Link from 'next/link';
import { resetPassword } from '@/utils/auth-helpers/server';
import { handleRequest } from '@/utils/auth-helpers/client';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import Button from '../Button/Button';

// Define prop type with allowEmail boolean
interface ForgotPasswordProps {
  redirectMethod: string;
  disableButton: boolean;
}

export default function ForgotPassword({
  redirectMethod,
  disableButton
}: ForgotPasswordProps) {
  const router = redirectMethod === 'client' ? useRouter() : null;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setIsSubmitting(true); // Disable the button while the request is being handled
    await handleRequest(e, resetPassword, router);
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col">
      <p className="text-16 text-darkgrey mb-24">
        Enter your email address and we'll send you a link to reset your
        password
      </p>
      <form
        noValidate={true}
        className="mb-4"
        onSubmit={(e) => handleSubmit(e)}
      >
        <div className="flex flex-col gap-24">
          <div className="flex flex-col gap-24">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
              <input
                id="email"
                placeholder="name@example.com"
                type="email"
                name="email"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect="off"
                className="w-full h-[50px] p-3 pl-[50px] rounded-12 bg-fullwhite text-darkgrey placeholder-zinc-500"
              />
            </div>
          </div>
          <Button text="Send Email" lowercase type="submit"></Button>
        </div>
      </form>
      <p>
        <Link
          href="/signin/password_signin"
          className="text-darkgrey text-16 underline"
        >
          Sign in with email and password
        </Link>
      </p>

      <p className="mt-4">
        <Link href="/signin/signup" className="text-darkgrey text-16 underline">
          Don't have an account? Sign up
        </Link>
      </p>
    </div>
  );
}
