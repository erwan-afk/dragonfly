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
import { getModelLabel, getProductLabel } from '@/utils/constants';
import { getMaxPhotos, getDuration, getProductFeatures } from '@/lib/product-features';
import { ArrowUpCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface UpgradeClientProps {
  boat: {
    id: string;
    model: string;
    price: number;
    currency: string;
    country: string;
    productId: string | null;
  };
  products: any[];
  upgradeOptions: any[];
  selectedPlanId: string | null;
  currentPriceId: string | null;
  currentPlanPrice: number;
}

function PaymentForm({
  boatId,
  newPlanId,
  onSuccess,
  onCancel
}: {
  boatId: string;
  newPlanId: string;
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
        // Call the upgrade API
        const response = await fetch('/api/boats/upgrade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            boatId,
            newPlan: newPlanId,
            paymentIntentId: paymentIntent.id
          })
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to upgrade boat');
        }

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
              <CheckCircle size={18} />
              Confirm Upgrade
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default function UpgradeClient({
  boat,
  products,
  upgradeOptions,
  selectedPlanId,
  currentPriceId,
  currentPlanPrice
}: UpgradeClientProps) {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<any>(
    selectedPlanId
      ? upgradeOptions.find((p) => p.id === selectedPlanId) || upgradeOptions[0] || null
      : upgradeOptions[0] || null
  );
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create payment intent when plan is selected
  useEffect(() => {
    if (!selectedPlan) {
      setClientSecret(null);
      return;
    }

    const createPaymentIntent = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const priceId = selectedPlan.prices?.[0]?.id;
        if (!priceId) {
          throw new Error('Selected plan has no price configured');
        }

        const response = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            priceId,
            currentPriceId,
            metadata: {
              boat_id: boat.id,
              product_id: selectedPlan.id,
              listing_type: 'upgrade'
            }
          })
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to create payment');
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    createPaymentIntent();
  }, [selectedPlan, boat.id]);

  const handleSuccess = () => {
    router.push(
      '/account?status=Success&status_description=Your listing has been upgraded successfully!'
    );
  };

  const currentPlanLabel = getProductLabel(boat.productId, products);

  return (
    <section className="mx-auto max-w-screen-lg py-8 px-16 xl:px-4">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/account"
          className="inline-flex items-center gap-2 text-oceanblue hover:text-articblue transition-colors mb-4"
        >
          <ArrowLeft size={18} />
          Back to My Account
        </Link>

        <div className="flex items-center gap-3 py-16">
          <ArrowUpCircle size={24} className=" text-articblue" />
          <h1 className="text-xl md:text-3xl font-bold text-articblue">
            Upgrade Your Listing
          </h1>
        </div>
      </div>

      {/* Current Listing Info */}
      <div className="bg-gray-50 rounded-xl p-6 mb-8 border">
        <div className="text-sm text-gray-500 mb-2">Current Listing</div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-lg md:text-xl font-semibold text-oceanblue">
              {getModelLabel(boat.model)}
            </div>
            <div className="text-gray-600">
              {boat.price.toLocaleString('en-US')} {boat.currency} - {boat.country}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Current Plan</div>
            <div className="font-medium text-oceanblue">{currentPlanLabel}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-24 lg:gap-64 py-16">
        {/* Plan Selection */}
        <div>
          <h2 className="text-xl font-semibold text-oceanblue mb-4">
            Select New Plan
          </h2>

          <div className="space-y-3">
            {upgradeOptions.map((product) => {
              const price = product.prices?.[0];
              const fullPrice = price?.unit_amount || 0;
              const differenceAmount = Math.max(0, fullPrice - currentPlanPrice);
              const priceAmount = (differenceAmount / 100).toFixed(2);
              const currency = price?.currency?.toUpperCase() || 'EUR';
              const isSelected = selectedPlan?.id === product.id;

              return (
                <button
                  key={product.id}
                  onClick={() => {
                    setSelectedPlan(product);
                    setTimeout(() => {
                      document.getElementById('upgrade-info')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 100);
                  }}
                  className={`w-full flex items-center justify-between p-4 border-2 rounded-xl transition-all duration-200 ${
                    isSelected
                      ? 'border-articblue bg-articblue/5'
                      : 'border-gray-200 hover:border-articblue/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected
                          ? 'border-articblue bg-articblue'
                          : 'border-gray-300'
                      }`}
                    >
                      {isSelected && (
                        <CheckCircle size={12} className="text-white" />
                      )}
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-oceanblue">
                        {product.name}
                      </div>
                      {product.description && (
                        <div className="text-sm text-gray-500">
                          {product.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="font-bold text-articblue">
                    {priceAmount} {currency}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Texte informatif sur les avantages */}
          {selectedPlan && (() => {
            const currentPlanName = getProductLabel(boat.productId, products);
            const currentPhotos = getMaxPhotos(currentPlanName);
            const newPhotos = getMaxPhotos(selectedPlan.name);
            const extraPhotos = newPhotos - currentPhotos;
            const isPodium = selectedPlan.name.toLowerCase().includes('podium');
            const dur = getDuration(selectedPlan.name);
            const durationMonths = typeof dur === 'object' ? dur.months : dur;

            return (
              <div id="upgrade-info" className="mt-6 bg-articblue/5 border border-articblue/20 rounded-xl p-5">
                <p className="text-oceanblue text-sm leading-relaxed mb-3">
                  En passant au forfait <strong>{selectedPlan.name}</strong>, vous bénéficiez immédiatement de :
                </p>
                <ul className="text-sm text-oceanblue space-y-2">
                  {extraPhotos > 0 && (
                    <li className="flex items-start gap-2">
                      <CheckCircle size={16} className="text-articblue mt-0.5 shrink-0" />
                      <span><strong>{extraPhotos} photo{extraPhotos > 1 ? 's' : ''} supplémentaire{extraPhotos > 1 ? 's' : ''}</strong> pour sublimer votre annonce.</span>
                    </li>
                  )}
                  {isPodium && (
                    <li className="flex items-start gap-2">
                      <CheckCircle size={16} className="text-articblue mt-0.5 shrink-0" />
                      <span>Une <strong>visibilité accrue</strong> auprès des acheteurs.</span>
                    </li>
                  )}
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-articblue mt-0.5 shrink-0" />
                    <span>Un nouveau départ : la durée de parution de votre annonce est réinitialisée à <strong>{durationMonths} mois</strong> à partir d&apos;aujourd&apos;hui.</span>
                  </li>
                </ul>
              </div>
            );
          })()}
        </div>

        {/* Payment Form */}
        <div>
          <h2 className="text-xl font-semibold text-oceanblue mb-4">Payment</h2>

          {!selectedPlan ? (
            <div className="bg-gray-50 rounded-xl p-32 text-center border">
              <ArrowUpCircle size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">
                Select a plan to continue with payment
              </p>
            </div>
          ) : isLoading ? (
            <div className="bg-gray-50 rounded-xl p-8 text-center border">
              <div className="h-8 w-8 rounded-full border-2 border-articblue border-t-transparent animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Preparing payment...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 rounded-xl p-6 border border-red-200">
              <p className="text-red-700 mb-4">{error}</p>
              <button
                onClick={() => setSelectedPlan(selectedPlan)}
                className="text-red-600 hover:text-red-800 font-medium"
              >
                Try again
              </button>
            </div>
          ) : clientSecret ? (
            <div className="bg-white rounded-xl p-6 border">
              <div className="mb-4 pb-4 border-b">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Upgrading to:</span>
                  <span className="font-semibold text-oceanblue">
                    {selectedPlan.name}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
                  <span>Full price:</span>
                  <span>
                    {(selectedPlan.prices[0].unit_amount / 100).toFixed(2)}{' '}
                    {selectedPlan.prices[0].currency.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1 text-sm text-gray-500">
                  <span>Current plan:</span>
                  <span>
                    -{(currentPlanPrice / 100).toFixed(2)}{' '}
                    {selectedPlan.prices[0].currency.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-dashed">
                  <span className="text-gray-600 font-medium">Upgrade difference:</span>
                  <span className="font-bold text-articblue text-lg">
                    {(Math.max(0, selectedPlan.prices[0].unit_amount - currentPlanPrice) / 100).toFixed(2)}{' '}
                    {selectedPlan.prices[0].currency.toUpperCase()}
                  </span>
                </div>
              </div>

              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                    variables: {
                      colorPrimary: '#0066CC'
                    }
                  }
                }}
              >
                <PaymentForm
                  boatId={boat.id}
                  newPlanId={selectedPlan.id}
                  onSuccess={handleSuccess}
                  onCancel={() => router.push('/account')}
                />
              </Elements>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
