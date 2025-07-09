'use client';

import Link from 'next/link';
import { signIn } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { Mail, Lock } from 'lucide-react';
import Button from '../Button/Button';

// Define prop type with allowEmail boolean
interface PasswordSignInProps {
  redirectMethod: string;
}

export default function PasswordSignIn({
  redirectMethod
}: PasswordSignInProps) {
  const router = redirectMethod === 'client' ? useRouter() : null;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);
      const email = String(formData.get('email')).trim();
      const password = String(formData.get('password')).trim();

      console.log('🔍 Better Auth SignIn started for email:', email);
      console.log('📝 Using Better Auth signIn.email method');

      const result = await signIn.email({
        email,
        password
      });

      console.log('📊 Better Auth SignIn result:', result);

      if (result.data) {
        console.log(
          '✅ Better Auth SignIn successful! User data:',
          result.data
        );
        console.log('🔄 Redirecting to account page...');
        // Utiliser window.location.href pour forcer un refresh complet et récupérer la session
        window.location.href =
          '/account?status=Success!&status_description=You are now signed in.';
      } else {
        console.error('❌ Better Auth SignIn failed. Full result:', result);
        console.error('❌ Error details:', result.error);
        setError(
          result.error?.message ||
            'Sign in failed. Please check your credentials.'
        );
      }
    } catch (error) {
      console.error('❌ Better Auth SignIn exception:', error);
      console.error(
        '❌ Exception stack:',
        error instanceof Error ? error.stack : 'No stack trace'
      );
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col">
      <p className="text-16 text-darkgrey mb-24">
        Are you a new user?
        <Link
          href="/signin/signup"
          className="ml-[5px] text-16 underline text-articblue"
        >
          Create an account
        </Link>
      </p>
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-12">
          {error}
        </div>
      )}
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
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
              <input
                id="password"
                placeholder="Password"
                type="password"
                name="password"
                autoComplete="current-password"
                className="w-full h-[50px] p-3 pl-[50px] rounded-12 bg-fullwhite text-darkgrey placeholder-zinc-500"
              />
            </div>
          </div>
          <Button text="Sign in" lowercase type="submit"></Button>
        </div>
      </form>
      <p>
        <Link
          href="/signin/forgot_password"
          className="text-darkgrey text-16 underline"
        >
          Forgot your password?
        </Link>
      </p>
    </div>
  );
}
