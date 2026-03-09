'use client';

import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import Button from '../Button/Button';
import Input from '../Input/Input';
import { authClient } from '@/lib/auth-client';

interface ForgotPasswordProps {
  redirectMethod: string;
  disableButton: boolean;
  onBackToLogin?: () => void;
}

export default function ForgotPassword({
  redirectMethod,
  disableButton,
  onBackToLogin
}: ForgotPasswordProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get('email')).trim();

    if (!email || !email.includes('@')) {
      setMessage({ type: 'error', text: 'Veuillez entrer une adresse email valide.' });
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await authClient.forgetPassword({
        email,
        redirectTo: '/reset-password',
      });

      if (error) {
        setMessage({ type: 'error', text: error.message || 'Une erreur est survenue.' });
      } else {
        setMessage({
          type: 'success',
          text: 'Si un compte existe avec cette adresse, un email de réinitialisation a été envoyé.'
        });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Une erreur est survenue. Veuillez réessayer.' });
    }

    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col">
      {message && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <form
        noValidate={true}
        className="mb-4"
        onSubmit={handleSubmit}
      >
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
          <Button
            text={isSubmitting ? 'Sending...' : 'Send Reset Link'}
            lowercase
            type="submit"
            loading={isSubmitting}
          />
        </div>
      </form>

      <div className="text-center">
        <button
          type="button"
          className="text-articblue cursor-pointer hover:underline bg-transparent border-none p-0 text-16"
          onClick={onBackToLogin}
        >
          Back to sign in
        </button>
      </div>
    </div>
  );
}
