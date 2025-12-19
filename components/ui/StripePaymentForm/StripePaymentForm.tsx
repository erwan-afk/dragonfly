'use client';

import { useState, useEffect } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { useLoading } from '../LoadingProvider';

interface StripePaymentFormProps {
  onSuccess: () => void;
  onError: (error: string) => void;
  returnUrl: string;
  onBeforePayment: () => Promise<{
    success: boolean;
    boatId?: string;
    error?: string;
  }>;
  amount: number;
  currency: string;
  priceId: string;
  userId: string;
  paymentIntentId?: string;
}

export default function StripePaymentForm({
  onSuccess,
  onError,
  returnUrl,
  onBeforePayment,
  amount,
  currency,
  priceId,
  userId,
  paymentIntentId
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { startLoading, stopLoading } = useLoading();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      console.warn('⚠️ Stripe or Elements not loaded yet');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');
    startLoading(); // Activer le loading global

    try {
      // 1. Exécuter le callback avant le paiement (créer bateau, uploader images)
      console.log('🔄 Executing pre-payment tasks...');
      const result = await onBeforePayment();

      console.log('📋 Pre-payment result:', result);

      if (!result.success) {
        console.error('❌ Pre-payment tasks failed - result:', result);
        const errorMsg =
          result.error || 'Please complete all required fields and try again';
        setErrorMessage(errorMsg);
        onError(errorMsg);
        setIsProcessing(false);
        return;
      }

      console.log('✅ Pre-payment tasks completed, boat ID:', result.boatId);

      // 2. Mettre à jour le PaymentIntent avec les métadonnées du bateau
      if (paymentIntentId && result.boatId) {
        console.log('🔄 Updating payment intent with boat metadata...');
        await fetch('/api/update-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentIntentId,
            metadata: {
              boat_id: result.boatId,
              listing_type: 'boat',
              user_id: userId
            }
          })
        });
      }

      // 3. Confirmer le paiement avec Stripe
      console.log('💰 Confirming payment...');
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl
        },
        redirect: 'if_required'
      });

      if (confirmError) {
        console.error('❌ Payment confirmation error:', confirmError);
        setErrorMessage(confirmError.message || 'An error occurred');
        onError(confirmError.message || 'An error occurred');
      } else {
        console.log('✅ Payment confirmed successfully!');
        onSuccess();
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred';
      console.error('❌ Payment error:', message);
      setErrorMessage(message);
      onError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <PaymentElement />

      {errorMessage && (
        <div className="text-red-500 text-sm p-3 bg-red-50 rounded-md">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-articblue text-white font-medium px-[53px] py-[20px] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-articblue/90 transition-colors"
      >
        {isProcessing ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
}
