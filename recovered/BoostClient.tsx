'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { ArrowLeft, CheckCircle, Rocket } from 'lucide-react';
import Link from 'next/link';
import { getModelLabel } from '@/utils/constants';
import { formatPriceNumber } from '@/utils/format-price';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface BoostClientProps {
  boat: {
    id: string;
    model: string;
    price: number;
    currency: string;
    country: string;
  };
}

function PaymentForm({
  onSuccess,
  onCancel
}: {
  onSuccess: () => void;
  onCancel: () => void;
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
      const { error: submitError, paymentIntent } = await stripe.confirmPayment(
        {
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/account?payment=success`
          },
          redirect: 'if_required'
        }
      );

      if (submitError) {
        setError(submitError.message || 'Payment failed');
        setIsProcessing(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess();
      }
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

      <div className="flex gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 px-4 border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 py-3 px-4 bg-articblue text-white rounded-lg hover:bg-oceanblue transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Rocket size={18} />
              Confirm Boost
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default function BoostClient({ boat }: BoostClientProps) {
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [currency, setCurrency] = useState<string>('eur');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const createIntent = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/boats/${boat.id}/boost`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to create boost payment');
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
        setAmount(data.amount);
        setCurrency(data.currency);
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    createIntent();
  }, [boat.id]);

  const handleSuccess = () => {
    router.push(
      '/account?status=Success&status_description=Your listing has been boosted for 48 hours!'
    );
  };

  return (
    <section className="mx-auto max-w-screen-md py-8 px-16 xl:px-4">
      <div className="mb-8">
        <Link
          href="/account"
          className="inline-flex items-center gap-2 text-oceanblue hover:text-articblue transition-colors mb-4"
        >
          <ArrowLeft size={18} />
          Back to My Account
        </Link>

        <div className="flex items-center gap-3 py-16">
          <Rocket size={24} className="text-articblue" />
          <h1 className="text-xl md:text-3xl font-bold text-articblue">
            Boost Your Listing
          </h1>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-6 mb-8 border">
        <div className="text-sm text-gray-500 mb-2">Listing</div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-lg md:text-xl font-semibold text-oceanblue">
              {getModelLabel(boat.model)}
            </div>
            <div className="text-gray-600">
              {formatPriceNumber(boat.price, boat.currency)} {boat.currency} -{' '}
              {boat.country}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-articblue/5 border border-articblue/20 rounded-xl p-5 mb-8">
        <p className="text-oceanblue text-sm leading-relaxed mb-3">
          <strong>Boost your visibility for 48 hours.</strong>
        </p>
        <ul className="text-sm text-oceanblue space-y-2">
          <li className="flex items-start gap-2">
            <CheckCircle size={16} className="text-articblue mt-0.5 shrink-0" />
            <span>Your ad jumps to the top of listings for 48 hours.</span>
          </li>

          <li className="flex items-start gap-2">
            <CheckCircle size={16} className="text-articblue mt-0.5 shrink-0" />
            <span>
              Premium plans (Podium, Mid-Course) keep their priority above
              boosted standard listings.
            </span>
          </li>
        </ul>
      </div>

      <h2 className="text-xl font-semibold text-oceanblue mb-4">Payment</h2>

      {isLoading ? (
        <div className="bg-gray-50 rounded-xl p-8 text-center border">
          <div className="h-8 w-8 rounded-full border-2 border-articblue border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Preparing payment...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 rounded-xl p-6 border border-red-200">
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => router.push('/account')}
            className="text-red-600 hover:text-red-800 font-medium"
          >
            Back to account
          </button>
        </div>
      ) : clientSecret && amount ? (
        <div className="bg-white rounded-xl p-6 border">
          <div className="mb-4 pb-4 border-b">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Boost duration:</span>
              <span className="font-semibold text-oceanblue">48 hours</span>
            </div>
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-dashed">
              <span className="text-gray-600 font-medium">Total:</span>
              <span className="font-bold text-articblue text-lg">
                {(amount / 100).toFixed(2)} {currency.toUpperCase()}
              </span>
            </div>
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
            <PaymentForm
              onSuccess={handleSuccess}
              onCancel={() => router.push('/account')}
            />
          </Elements>
        </div>
      ) : null}
    </section>
  );
}
