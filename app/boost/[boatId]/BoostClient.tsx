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
import {
  ArrowLeft,
  CheckCircle,
  Rocket,
  TrendingUp,
  Eye,
  Clock,
  Lock
} from 'lucide-react';
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
  onCancel,
  isProcessingExternal
}: {
  onSuccess: () => void;
  onCancel: () => void;
  isProcessingExternal?: boolean;
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-24">
      <div className="rounded-12 border border-stonegrey/20 p-16 bg-fullwhite">
        <PaymentElement />
      </div>

      {error && (
        <div className="rounded-12 border border-red-200 bg-red-50 text-red-700 px-16 py-12 text-14">
          {error}
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row gap-12">
        <button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1 h-[48px] rounded-full border-2 border-stonegrey/40 text-oceanblue text-14 font-medium hover:bg-lightgrey transition-colors cursor-pointer disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 h-[48px] rounded-full bg-articblue text-fullwhite text-14 font-medium hover:bg-oceanblue transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-8 cursor-pointer"
        >
          {isProcessing ? (
            <>
              <span className="h-[16px] w-[16px] rounded-full border-2 border-fullwhite border-t-transparent animate-spin" />
              Processing…
            </>
          ) : (
            <>
              <Rocket size={16} />
              Confirm boost
            </>
          )}
        </button>
      </div>

      <div className="flex items-center justify-center gap-8 text-stonegrey text-12">
        <Lock size={12} />
        <span>Secure payment via Stripe — your card data never touches our servers</span>
      </div>
    </form>
  );
}

function BenefitRow({
  icon,
  title,
  description
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <li className="flex flex-row items-start gap-12">
      <div className="shrink-0 w-[36px] h-[36px] rounded-full bg-articblue/10 flex items-center justify-center text-articblue">
        {icon}
      </div>
      <div className="flex flex-col gap-2">
        <div className="text-oceanblue text-14 font-medium">{title}</div>
        <div className="text-darkgrey text-13 leading-relaxed">{description}</div>
      </div>
    </li>
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

  const formattedAmount = amount ? (amount / 100).toFixed(2) : null;
  const currencyUpper = currency.toUpperCase();

  return (
    <div className="w-full bg-fullwhite">
      <section className="mx-auto max-w-screen-xl py-32 lg:py-48 px-16 xl:px-0">
        {/* Top nav */}
        <Link
          href="/account"
          className="inline-flex items-center gap-8 text-stonegrey hover:text-articblue transition-colors text-14 mb-24"
        >
          <ArrowLeft size={16} />
          Back to my account
        </Link>

        {/* Hero */}
        <header className="flex flex-col gap-12 mb-32 lg:mb-48">
          <div className="inline-flex items-center gap-8 w-fit px-12 py-4 rounded-full bg-articblue/10 text-articblue text-12 font-medium">
            <Rocket size={14} />
            48-hour visibility boost
          </div>
          <h1 className="text-oceanblue text-32 lg:text-40 leading-tight max-w-2xl">
            Get your listing seen by{' '}
            <span className="text-articblue">more buyers</span>
          </h1>
          <p className="text-darkgrey text-16 max-w-2xl">
            Push your ad to the top of search results and the homepage for 48
            hours. Buyers actively browsing will see it first.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-24 lg:gap-32 items-start">
          {/* LEFT: listing summary + benefits */}
          <div className="flex flex-col gap-24">
            {/* Listing card */}
            <div className="rounded-16 border border-stonegrey/20 bg-lightgrey/40 p-24">
              <div className="text-stonegrey text-12 uppercase tracking-wider font-medium mb-8">
                Boosting this listing
              </div>
              <div className="flex flex-col gap-4">
                <div className="text-oceanblue text-24 font-medium">
                  {getModelLabel(boat.model)}
                </div>
                <div className="text-darkgrey text-14">
                  {formatPriceNumber(boat.price, boat.currency)}{' '}
                  {boat.currency.toUpperCase()} · {boat.country}
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className="rounded-16 border border-stonegrey/20 bg-fullwhite p-24">
              <h2 className="text-oceanblue text-20 font-medium mb-16">
                What you get
              </h2>
              <ul className="flex flex-col gap-16">
                <BenefitRow
                  icon={<TrendingUp size={18} />}
                  title="Top placement for 48 hours"
                  description="Your ad jumps to the top of the For Sale listings and the homepage spotlight."
                />
                <BenefitRow
                  icon={<Eye size={18} />}
                  title="More visibility, more contacts"
                  description="Boosted ads receive on average significantly more views and seller contacts."
                />
                <BenefitRow
                  icon={<Clock size={18} />}
                  title="Effective immediately"
                  description="The boost starts the moment your payment is confirmed. No waiting, no setup."
                />
                <BenefitRow
                  icon={<CheckCircle size={18} />}
                  title="One-time purchase"
                  description="No subscription. Pay once, the boost runs for 48 hours and automatically ends."
                />
              </ul>
            </div>

            {/* Fine print */}
            <div className="text-stonegrey text-12 leading-relaxed">
              Note: Premium plans (Podium, Mid-Course) keep their natural
              priority above boosted standard listings. The boost still
              elevates your ad above non-premium listings.
            </div>
          </div>

          {/* RIGHT: payment panel — sticky on desktop */}
          <aside className="lg:sticky lg:top-32 flex flex-col gap-16">
            <div className="rounded-16 border-2 border-articblue/20 bg-fullwhite shadow-sm overflow-hidden">
              {/* Price header */}
              <div className="bg-gradient-to-br from-articblue to-oceanblue px-24 py-24 text-fullwhite">
                <div className="text-fullwhite/80 text-12 uppercase tracking-wider font-medium mb-8">
                  Total
                </div>
                <div className="flex items-baseline gap-8">
                  <div className="text-40 lg:text-48 font-medium leading-none">
                    {formattedAmount ?? '—'}
                  </div>
                  <div className="text-20 font-medium opacity-90">
                    {currencyUpper}
                  </div>
                </div>
                <div className="flex items-center gap-8 mt-12 text-fullwhite/90 text-13">
                  <Clock size={14} />
                  48-hour boost, one-time
                </div>
              </div>

              {/* Payment body */}
              <div className="p-24">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center gap-16 py-32">
                    <div className="h-[32px] w-[32px] rounded-full border-2 border-articblue border-t-transparent animate-spin" />
                    <p className="text-darkgrey text-14">Preparing payment…</p>
                  </div>
                ) : error ? (
                  <div className="flex flex-col gap-16">
                    <div className="rounded-12 border border-red-200 bg-red-50 text-red-700 px-16 py-12 text-14">
                      {error}
                    </div>
                    <button
                      onClick={() => router.push('/account')}
                      className="h-[44px] rounded-full border-2 border-stonegrey/40 text-oceanblue text-14 font-medium hover:bg-lightgrey transition-colors cursor-pointer"
                    >
                      Back to account
                    </button>
                  </div>
                ) : clientSecret && amount ? (
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret,
                      appearance: {
                        theme: 'flat',
                        variables: {
                          colorPrimary: '#58A4A7',
                          colorBackground: '#FDFDFD',
                          colorText: '#235B68',
                          colorDanger: '#dc2626',
                          fontFamily: 'inherit',
                          borderRadius: '8px',
                          spacingUnit: '4px'
                        }
                      }
                    }}
                  >
                    <PaymentForm
                      onSuccess={handleSuccess}
                      onCancel={() => router.push('/account')}
                    />
                  </Elements>
                ) : null}
              </div>
            </div>

            {/* Trust line */}
            <div className="flex items-center justify-center gap-8 text-stonegrey text-12">
              <Lock size={12} />
              <span>SSL encrypted · PCI compliant</span>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
