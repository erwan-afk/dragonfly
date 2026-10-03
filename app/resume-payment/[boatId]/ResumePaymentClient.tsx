'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { getModelLabel } from '@/utils/constants';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { trackBeginCheckout, trackPurchase } from '@/lib/gtm';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface ResumePaymentClientProps {
  boat: {
    id: string;
    model: string;
    price: number;
    currency: string;
    country: string;
    productName: string | null;
    priceId: string;
    amount: number;
  };
}

function PaymentForm({
  boatId,
  onSuccess
}: {
  boatId: string;
  onSuccess: (paymentIntentId: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError(null);

    try {
      const { error: submitError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/account?payment=success`
        },
        redirect: 'if_required'
      });

      // Only "succeeded" counts as paid — see StripePaymentForm.tsx for why
      // treating "no error" alone as success is wrong.
      if (submitError || paymentIntent?.status !== 'succeeded') {
        setError(
          submitError?.message ||
            'Payment was not completed. Please try again or use a different payment method.'
        );
        setIsProcessing(false);
        return;
      }

      const confirmRes = await fetch('/api/confirm-boat-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIntentId: paymentIntent.id, boatId })
      });
      const confirmData = await confirmRes.json();

      if (!confirmRes.ok || !(confirmData.success || confirmData.alreadyActive)) {
        throw new Error(confirmData.error || 'Failed to activate listing');
      }

      onSuccess(paymentIntent.id);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full py-3 px-4 bg-articblue text-white rounded-lg hover:bg-oceanblue transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CheckCircle size={18} />
            Pay Now
          </>
        )}
      </button>
    </form>
  );
}

export default function ResumePaymentClient({ boat }: ResumePaymentClientProps) {
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const createPaymentIntent = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            priceId: boat.priceId,
            metadata: {
              boat_id: boat.id,
              listing_type: 'new_listing'
            }
          })
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to create payment');
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);

        // GTM: begin_checkout — fires once the Payment Element is ready,
        // matching the same-named event in the new-listing / upgrade flows.
        trackBeginCheckout({
          plan_name: boat.productName || 'unknown',
          transaction_type: 'new_listing',
          value: boat.amount / 100,
          currency: boat.currency.toUpperCase()
        });
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    createPaymentIntent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boat.id]);

  const handleSuccess = (paymentIntentId: string) => {
    trackPurchase({
      transaction_id: paymentIntentId,
      plan_name: boat.productName || 'unknown',
      transaction_type: 'new_listing',
      value: boat.amount / 100,
      currency: boat.currency.toUpperCase()
    });
    router.push(
      '/account?status=Success&status_description=Your listing is now live!'
    );
  };

  return (
    <section className="mx-auto max-w-screen-sm py-8 px-16 xl:px-4">
      <Link
        href="/account"
        className="inline-flex items-center gap-2 text-oceanblue hover:text-articblue transition-colors mb-4"
      >
        <ArrowLeft size={18} />
        Back to My Account
      </Link>

      <div className="flex items-center gap-3 py-16">
        <h1 className="text-xl md:text-3xl font-bold text-articblue">
          Finish publishing your listing
        </h1>
      </div>

      <div className="bg-gray-50 rounded-xl p-6 mb-8 border">
        <div className="text-sm text-gray-500 mb-2">Listing</div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-lg md:text-xl font-semibold text-oceanblue">
              {getModelLabel(boat.model)}
            </div>
            <div className="text-gray-600">{boat.country}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Plan</div>
            <div className="font-medium text-oceanblue">
              {boat.productName || '—'}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="h-8 w-8 rounded-full border-2 border-articblue border-t-transparent animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Preparing payment...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 rounded-xl p-6 border border-red-200">
            <p className="text-red-700">{error}</p>
          </div>
        ) : clientSecret ? (
          <>
            <div className="mb-4 pb-4 border-b flex justify-between items-center">
              <span className="text-gray-600">Amount due:</span>
              <span className="font-bold text-articblue text-lg">
                {(boat.amount / 100).toFixed(2)} {boat.currency.toUpperCase()}
              </span>
            </div>
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: { colorPrimary: '#0066CC' }
                }
              }}
            >
              <PaymentForm boatId={boat.id} onSuccess={handleSuccess} />
            </Elements>
          </>
        ) : null}
      </div>
    </section>
  );
}
