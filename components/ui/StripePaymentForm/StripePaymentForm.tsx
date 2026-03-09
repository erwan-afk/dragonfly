'use client';

import { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { useLoading } from '../LoadingProvider';
import PaymentProgress from '../PaymentProgress';

interface StripePaymentFormProps {
  onSuccess: () => void;
  onError: (error: string) => void;
  returnUrl: string;
  onBeforePayment: (onStepChange?: (step: number) => void) => Promise<{
    success: boolean;
    boatId?: string;
    error?: string;
  }>;
  amount: number;
  currency: string;
  priceId: string;
  productId?: string;
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
  productId,
  userId,
  paymentIntentId
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [paymentStep, setPaymentStep] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const { startLoading, stopLoading } = useLoading();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      console.warn('⚠️ Stripe or Elements not loaded yet');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');
    setShowProgress(true);
    setPaymentStep(0);
    startLoading();

    try {
      // 1. Exécuter le callback avant le paiement (créer bateau, uploader images)
      console.log('🔄 Executing pre-payment tasks...');
      const result = await onBeforePayment((step) => setPaymentStep(step));

      console.log('📋 Pre-payment result:', result);

      if (!result.success) {
        console.error('❌ Pre-payment tasks failed - result:', result);
        const errorMsg =
          result.error || 'Please complete all required fields and try again';
        setErrorMessage(errorMsg);
        onError(errorMsg);
        setIsProcessing(false);
        setShowProgress(false);
        stopLoading();
        return;
      }

      console.log('✅ Pre-payment tasks completed, boat ID:', result.boatId);

      // 2. Mettre à jour le PaymentIntent avec les métadonnées du bateau
      setPaymentStep(2);
      if (paymentIntentId && result.boatId) {
        console.log('🔄 Updating payment intent with boat metadata...');
        const updateRes = await fetch('/api/update-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentIntentId,
            metadata: {
              boat_id: result.boatId,
              listing_type: 'boat',
              user_id: userId,
              product_id: productId || ''
            }
          })
        });

        if (!updateRes.ok) {
          const errorMsg = 'Failed to prepare payment metadata. Please try again.';
          console.error('❌ update-payment-intent failed:', updateRes.status);
          setErrorMessage(errorMsg);
          onError(errorMsg);
          setIsProcessing(false);
          setShowProgress(false);
          stopLoading();
          return;
        }
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
        setPaymentStep(3);

        // 4. Activate the boat directly (don't rely solely on webhook)
        if (paymentIntentId && result.boatId) {
          let activated = false;
          for (let attempt = 0; attempt < 3; attempt++) {
            try {
              console.log(`🔄 Activating boat (attempt ${attempt + 1}/3)...`);
              const confirmRes = await fetch('/api/confirm-boat-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  paymentIntentId,
                  boatId: result.boatId
                })
              });
              const confirmData = await confirmRes.json();
              if (confirmRes.ok && (confirmData.success || confirmData.alreadyActive)) {
                console.log('✅ Boat activated successfully');
                activated = true;
                break;
              }
              console.warn(`⚠️ Activation attempt ${attempt + 1} failed:`, confirmData.error);
            } catch (confirmErr) {
              console.warn(`⚠️ Activation attempt ${attempt + 1} error:`, confirmErr);
            }
            // Wait before retry
            if (attempt < 2) await new Promise(r => setTimeout(r, 1500));
          }
          if (!activated) {
            console.warn('⚠️ Direct activation failed after 3 attempts, webhook will handle it');
          }
        }

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
      setShowProgress(false);
      stopLoading();
    }
  };

  return (
    <>
    <PaymentProgress currentStep={paymentStep} isVisible={showProgress} />
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
    </>
  );
}
