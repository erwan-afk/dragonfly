'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/ui/Button';

export default function PaymentErrorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  // Récupérer les paramètres d'erreur de l'URL
  const errorType = searchParams.get('type') || 'payment_failed';
  const errorMessage = searchParams.get('message') || 'The payment failed';
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Éviter l'hydration mismatch
  }

  const getErrorInfo = () => {
    switch (errorType) {
      case 'session_expired':
        return {
          title: 'Session expired',
          message: 'Your payment session has expired. Please try again.',
          icon: '⏰'
        };
      case 'payment_failed':
        return {
          title: 'Payment failed',
          message: 'The payment could not be processed. Check your payment information.',
          icon: '❌'
        };
      case 'payment_cancelled':
        return {
          title: 'Payment cancelled',
          message: 'You cancelled the payment. Your listing has not been created.',
          icon: '🚫'
        };
      default:
        return {
          title: 'Payment error',
          message: errorMessage,
          icon: '⚠️'
        };
    }
  };

  const errorInfo = getErrorInfo();

  const handleRetry = () => {
    router.push('/list-boat');
  };

  const handleGoToAccount = () => {
    router.push('/account?section=ads');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-16">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 md:p-8">
        <div className="text-center">
          {/* Icône d'erreur */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <span className="text-2xl">{errorInfo.icon}</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {errorInfo.title}
          </h1>

          <p className="text-gray-600 mb-6">
            {errorInfo.message}
          </p>

          {/* Message d'information */}
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">
              Your listing has not been created and no charges were made.
            </p>
            <p className="text-red-600 text-xs mt-1">
              Uploaded images have been automatically deleted.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              text="Try again"
              onClick={handleRetry}
              fullwidth
            />

            <button
              onClick={handleGoToAccount}
              className="w-full text-gray-500 hover:text-gray-700 text-sm py-2"
            >
              Go to my account
            </button>
            
            <button
              onClick={() => router.push('/')}
              className="w-full text-gray-400 hover:text-gray-600 text-xs py-1"
            >
              Back to home
            </button>
          </div>

          {/* Aide */}
          <div className="mt-8 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              If the problem persists, contact our support at{' '}
              <a href="mailto:support@example.com" className="text-blue-600 hover:underline">
                support@example.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 