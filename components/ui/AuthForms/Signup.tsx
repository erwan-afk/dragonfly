'use client';
import Link from 'next/link';
import { signUp } from '@/lib/auth-client'; // Import direct
import { useRouter } from 'next/navigation';
import React, { useState, useCallback } from 'react';
import { Mail, Lock, User } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '../Input/Input';
import { useReCaptcha } from 'next-recaptcha-v3';

interface SignUpProps {
  redirectMethod: string;
}

export default function SignUp({ redirectMethod }: SignUpProps) {
  const router = redirectMethod === 'client' ? useRouter() : null;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmPassword, setConfirmPassword] = useState('');
  const { executeRecaptcha } = useReCaptcha();

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsSubmitting(true);
      setError(null);

      try {
        const formData = new FormData(e.currentTarget);
        const email = String(formData.get('email')).trim();
        const password = String(formData.get('password')).trim();
        const name = String(formData.get('name')).trim();

        // Vérifier que les mots de passe correspondent
        if (password !== confirmPassword) {
          setError('Passwords do not match. Please try again.');
          setIsSubmitting(false);
          return;
        }

        // Validation basique du mot de passe
        if (password.length < 8) {
          setError('Password must be at least 8 characters long.');
          setIsSubmitting(false);
          return;
        }

        // Generate reCAPTCHA token
        const token = await executeRecaptcha('signup');
        if (!token) {
          setError('Please complete the reCAPTCHA verification.');
          setIsSubmitting(false);
          return;
        }

        console.log('🔐 Validating reCAPTCHA...');

        // Valider le captcha côté serveur
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

        console.log('✅ reCAPTCHA validated');

        const displayName = name || email.split('@')[0];

        console.log('🔍 Starting Better Auth SignUp for:', email);

        // Utiliser signUp.email directement (pas authClient.signUp.email)
        const { data, error: signUpError } = await signUp.email(
          {
            email,
            password,
            name: displayName,
            callbackURL: '/account'
          },
          {
            onRequest: () => {
              console.log('📤 SignUp request sent...');
            },
            onSuccess: (ctx) => {
              console.log('✅ SignUp successful!', ctx);
            },
            onError: (ctx) => {
              console.error('❌ SignUp error:', ctx.error);
            }
          }
        );

        console.log('📊 SignUp result:', { data, error: signUpError });

        if (signUpError) {
          console.error('❌ SignUp failed:', signUpError);
          setError(signUpError.message || 'Sign up failed. Please try again.');
          return;
        }

        if (data) {
          console.log('✅ SignUp successful!');
          console.log('👤 User:', data.user);

          const status = 'Success!';
          const description =
            'Your account has been created successfully and you are now signed in.';
          const params = new URLSearchParams({
            status: status,
            status_description: description
          });

          const redirectUrl = `/account?${params.toString()}`;
          console.log('🔗 Redirecting to:', redirectUrl);

          // Petit délai pour s'assurer que les cookies sont bien définis
          setTimeout(() => {
            if (redirectMethod === 'client' && router) {
              router.push(redirectUrl);
            } else {
              window.location.href = redirectUrl;
            }
          }, 100);
        }
      } catch (error) {
        console.error('❌ Better Auth SignUp exception:', error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred.';
        setError(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    },
    [executeRecaptcha, confirmPassword, redirectMethod, router]
  );

  return (
    <div>
      {error && (
        <div
          style={{
            color: '#dc2626',
            padding: '12px',
            marginBottom: '16px',
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            fontSize: '14px'
          }}
        >
          {error}
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-24 items-center justify-center"
      >
        <Input
          name="name"
          type="text"
          placeholder="Full name"
          required
          autoComplete="name"
          startContent={<User />}
        />
        <Input
          name="email"
          type="email"
          placeholder="Email"
          required
          autoComplete="email"
          startContent={<Mail />}
        />
        <Input
          name="password"
          type="password"
          placeholder="Password (min. 8 characters)"
          required
          autoComplete="new-password"
          startContent={<Lock />}
        />
        <Input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
          startContent={<Lock />}
        />
        <Button
          type="submit"
          text={isSubmitting ? 'Creating account...' : 'Sign Up'}
          loading={isSubmitting}
          icon="link"
        />
      </form>
    </div>
  );
}
