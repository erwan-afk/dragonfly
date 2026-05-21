'use client';

import Link from 'next/link';
import { signIn } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { Mail, Lock } from 'lucide-react';
import { useReCaptcha } from 'next-recaptcha-v3';
import Button from '../Button/Button';
import Input from '../Input/Input';

// Define prop type with allowEmail boolean
interface PasswordSignInProps {
  redirectMethod: string;
  callbackUrl?: string;
}

export default function PasswordSignIn({
  redirectMethod,
  callbackUrl
}: PasswordSignInProps) {
  const router = redirectMethod === 'client' ? useRouter() : null;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { executeRecaptcha } = useReCaptcha();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);
      const email = String(formData.get('email')).trim();
      const password = String(formData.get('password')).trim();

      const token = await executeRecaptcha('signin');
      if (!token) {
        setError('Please complete the reCAPTCHA verification.');
        setIsSubmitting(false);
        return;
      }

      const captchaValidation = await fetch('/api/auth/validate-captcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      if (!captchaValidation.ok) {
        setError('reCAPTCHA verification failed. Please try again.');
        setIsSubmitting(false);
        return;
      }

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
        const safeRedirect =
          callbackUrl?.startsWith('/') ? callbackUrl : '/account';
        const separator = safeRedirect.includes('?') ? '&' : '?';
        window.location.href =
          safeRedirect +
          separator +
          'status=Success!&status_description=You are now signed in.';
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
            <Input
              id="email"
              placeholder="name@example.com"
              type="email"
              name="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              startContent={<Mail className="w-5 h-5" />}
            />
            <Input
              id="password"
              placeholder="Password"
              type="password"
              name="password"
              autoComplete="current-password"
              startContent={<Lock className="w-5 h-5" />}
            />
          </div>
          <div className="flex justify-center">
            <Button text="Sign in" icon="link" lowercase type="submit"></Button>
          </div>
        </div>
      </form>
    </div>
  );
}
