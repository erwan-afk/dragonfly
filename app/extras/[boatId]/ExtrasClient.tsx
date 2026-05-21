'use client';

import { useState, useEffect, useRef } from 'react';
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
  Image as ImageIcon,
  Film,
  Lock,
  Sparkles,
  Check
} from 'lucide-react';
import Link from 'next/link';
import { getModelLabel } from '@/utils/constants';
import { formatPriceNumber } from '@/utils/format-price';
import { isValidVideoUrl } from '@/utils/video-embed';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface PriceInfo {
  amount: number;
  currency: string;
}

interface ExtrasClientProps {
  boat: {
    id: string;
    model: string;
    price: number;
    currency: string;
    country: string;
    hasExtraPhotos: boolean;
    videoUrl: string | null;
  };
  photoPrice: PriceInfo | null;
  videoPrice: PriceInfo | null;
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
          Back
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
              <CheckCircle size={16} />
              Confirm purchase
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

interface AddOnCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  price: PriceInfo | null;
  available: boolean;
  selected: boolean;
  onToggle: (selected: boolean) => void;
  children?: React.ReactNode;
}

function AddOnCard({
  icon,
  title,
  description,
  price,
  available,
  selected,
  onToggle,
  children
}: AddOnCardProps) {
  const interactive = available;
  const formattedPrice = price
    ? `${(price.amount / 100).toFixed(2)} ${price.currency.toUpperCase()}`
    : null;

  return (
    <div
      className={`rounded-16 border-2 transition-all duration-200 ${
        !available
          ? 'border-stonegrey/20 bg-lightgrey/30 opacity-70'
          : selected
            ? 'border-articblue bg-articblue/5 shadow-sm'
            : 'border-stonegrey/20 bg-fullwhite hover:border-articblue/40'
      }`}
    >
      <button
        type="button"
        onClick={() => interactive && onToggle(!selected)}
        disabled={!interactive}
        className={`w-full text-left p-24 flex items-start gap-16 ${
          interactive ? 'cursor-pointer' : 'cursor-not-allowed'
        }`}
      >
        <div
          className={`shrink-0 w-[48px] h-[48px] rounded-full flex items-center justify-center ${
            selected
              ? 'bg-articblue text-fullwhite'
              : 'bg-articblue/10 text-articblue'
          }`}
        >
          {icon}
        </div>

        <div className="flex-1 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-16">
            <div className="flex flex-col gap-2">
              <div className="text-oceanblue text-18 font-medium">{title}</div>
              {!available && (
                <div className="inline-flex items-center gap-4 w-fit text-articblue text-12 font-medium">
                  <Check size={12} />
                  Already added to this listing
                </div>
              )}
            </div>
            {formattedPrice && available && (
              <div className="text-articblue text-20 font-medium whitespace-nowrap">
                {formattedPrice}
              </div>
            )}
          </div>
          <p className="text-darkgrey text-14 leading-relaxed">{description}</p>
        </div>

        {/* Selection indicator */}
        {available && (
          <div
            className={`shrink-0 w-[24px] h-[24px] rounded-full border-2 flex items-center justify-center transition-colors ${
              selected
                ? 'bg-articblue border-articblue'
                : 'bg-fullwhite border-stonegrey/40'
            }`}
            aria-hidden="true"
          >
            {selected && <Check size={14} className="text-fullwhite" />}
          </div>
        )}
      </button>

      {children && available && selected && (
        <div className="px-24 pb-24 pt-0">
          <div className="border-t border-stonegrey/20 pt-16">{children}</div>
        </div>
      )}
    </div>
  );
}

export default function ExtrasClient({
  boat,
  photoPrice,
  videoPrice
}: ExtrasClientProps) {
  const router = useRouter();

  const photoAvailable = !boat.hasExtraPhotos;
  const videoAvailable = !boat.videoUrl;

  // Pre-select the first available add-on so payment form shows up immediately
  const [selectPhotos, setSelectPhotos] = useState(photoAvailable);
  const [selectVideo, setSelectVideo] = useState(
    !photoAvailable && videoAvailable
  );
  const [videoUrl, setVideoUrl] = useState('');
  const [videoUrlError, setVideoUrlError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [currency, setCurrency] = useState<string>('eur');
  const [isLoadingIntent, setIsLoadingIntent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const photoSubtotal = selectPhotos && photoPrice ? photoPrice.amount : 0;
  const videoSubtotal = selectVideo && videoPrice ? videoPrice.amount : 0;
  const total = photoSubtotal + videoSubtotal;
  const totalCurrency = (
    photoPrice?.currency ||
    videoPrice?.currency ||
    'eur'
  ).toUpperCase();

  // Video URL is required only when video is selected — for the intent we
  // need a valid URL, but we still let the user toggle the option freely.
  const videoUrlValid = selectVideo
    ? videoUrl.trim().length > 0 && isValidVideoUrl(videoUrl.trim())
    : true;

  const wantsAtLeastOne = selectPhotos || selectVideo;
  const intentReady = wantsAtLeastOne && videoUrlValid;

  // Debounced PaymentIntent refresh when selection changes
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!intentReady) {
      setClientSecret(null);
      setAmount(null);
      setError(null);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setIsLoadingIntent(true);
      setError(null);

      const addOns: string[] = [];
      if (selectPhotos) addOns.push('extra_photos');
      if (selectVideo) addOns.push('video');

      try {
        const response = await fetch(`/api/boats/${boat.id}/extras`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            addOns,
            videoUrl: selectVideo ? videoUrl.trim() : undefined
          })
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to create payment');
        }
        const data = await response.json();
        setClientSecret(data.clientSecret);
        setAmount(data.amount);
        setCurrency(data.currency);
      } catch (err: any) {
        setError(err.message || 'An error occurred');
        setClientSecret(null);
        setAmount(null);
      } finally {
        setIsLoadingIntent(false);
      }
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [
    intentReady,
    selectPhotos,
    selectVideo,
    videoUrl,
    boat.id
  ]);

  const handleSuccess = () => {
    router.push(
      '/account?status=Success&status_description=Add-ons activated on your listing.'
    );
  };

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
            <Sparkles size={14} />
            Listing add-ons
          </div>
          <h1 className="text-oceanblue text-32 lg:text-40 leading-tight max-w-2xl">
            Make your listing{' '}
            <span className="text-articblue">stand out</span>
          </h1>
          <p className="text-darkgrey text-16 max-w-2xl">
            Upgrade your existing ad with extra photos or a video. Buyers
            engage longer with rich listings — more visuals usually means more
            serious enquiries.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-24 lg:gap-32 items-start">
          {/* LEFT: listing summary + add-on cards (or recap if on payment step) */}
          <div className="flex flex-col gap-24">
            {/* Listing card */}
            <div className="rounded-16 border border-stonegrey/20 bg-lightgrey/40 p-24">
              <div className="text-stonegrey text-12 uppercase tracking-wider font-medium mb-8">
                Upgrading this listing
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

            <AddOnCard
              icon={<ImageIcon size={22} />}
              title="+5 extra photos"
              description="Unlock 5 additional photo slots on your listing. Show more angles — interior, rigging, equipment — and let buyers see the full picture before contacting you."
              price={photoPrice}
              available={photoAvailable}
              selected={selectPhotos}
              onToggle={(v) => setSelectPhotos(v)}
            />

            <AddOnCard
              icon={<Film size={22} />}
              title="Video link"
              description="Embed a YouTube, Vimeo or Dailymotion video on your listing. A short walk-around or sailing clip can replace dozens of photos."
              price={videoPrice}
              available={videoAvailable}
              selected={selectVideo}
              onToggle={(v) => {
                setSelectVideo(v);
                if (!v) {
                  setVideoUrl('');
                  setVideoUrlError(null);
                }
              }}
            >
              <label className="flex flex-col gap-8">
                <span className="text-oceanblue text-13 font-medium">
                  Video URL
                </span>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => {
                    setVideoUrl(e.target.value);
                    setVideoUrlError(null);
                  }}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full h-[44px] px-12 rounded-lg bg-fullwhite border-2 border-stonegrey/30 text-oceanblue text-14 placeholder:text-stonegrey focus:border-articblue focus:outline-none transition-colors"
                />
                {videoUrlError && (
                  <p className="text-red-600 text-12">{videoUrlError}</p>
                )}
                {!videoUrlError &&
                  videoUrl &&
                  !isValidVideoUrl(videoUrl) && (
                    <p className="text-orange-600 text-12">
                      Must be a valid YouTube, Vimeo or Dailymotion URL.
                    </p>
                  )}
              </label>
            </AddOnCard>

            {error && (
              <div className="rounded-12 border border-red-200 bg-red-50 text-red-700 px-16 py-12 text-14">
                {error}
              </div>
            )}

            {!photoAvailable && !videoAvailable && (
              <div className="rounded-12 border border-articblue/30 bg-articblue/5 text-oceanblue px-16 py-12 text-14">
                All add-ons have already been purchased for this listing.
              </div>
            )}
          </div>

          {/* RIGHT: sticky summary / payment panel */}
          <aside className="lg:sticky lg:top-32 flex flex-col gap-16">
            <div className="rounded-16 border-2 border-articblue/20 bg-fullwhite shadow-sm overflow-hidden">
              {/* Price header */}
              <div className="bg-gradient-to-br from-articblue to-oceanblue px-24 py-24 text-fullwhite">
                <div className="text-fullwhite/80 text-12 uppercase tracking-wider font-medium mb-8">
                  Total
                </div>
                <div className="flex items-baseline gap-8">
                  <div className="text-40 lg:text-48 font-medium leading-none">
                    {(total / 100).toFixed(2)}
                  </div>
                  <div className="text-20 font-medium opacity-90">
                    {totalCurrency}
                  </div>
                </div>
                <div className="text-fullwhite/90 text-13 mt-12">
                  {wantsAtLeastOne
                    ? `${(selectPhotos ? 1 : 0) + (selectVideo ? 1 : 0)} add-on${
                        (selectPhotos ? 1 : 0) + (selectVideo ? 1 : 0) > 1
                          ? 's'
                          : ''
                      } selected`
                    : 'Pick at least one add-on'}
                </div>
              </div>

              {/* Body — payment form always visible (or appropriate state) */}
              <div className="p-24">
                {!wantsAtLeastOne ? (
                  <div className="flex flex-col items-center justify-center gap-12 py-24 text-center">
                    <div className="w-[48px] h-[48px] rounded-full bg-articblue/10 flex items-center justify-center text-articblue">
                      <Sparkles size={20} />
                    </div>
                    <p className="text-darkgrey text-14">
                      Select one or more add-ons to start payment.
                    </p>
                  </div>
                ) : selectVideo && !videoUrlValid ? (
                  <div className="flex flex-col items-center justify-center gap-12 py-24 text-center">
                    <div className="w-[48px] h-[48px] rounded-full bg-articblue/10 flex items-center justify-center text-articblue">
                      <Film size={20} />
                    </div>
                    <p className="text-darkgrey text-14">
                      Enter a valid video URL to continue.
                    </p>
                  </div>
                ) : isLoadingIntent || !clientSecret ? (
                  <div className="flex flex-col items-center justify-center gap-16 py-24">
                    <div className="h-[32px] w-[32px] rounded-full border-2 border-articblue border-t-transparent animate-spin" />
                    <p className="text-darkgrey text-14">Preparing payment…</p>
                  </div>
                ) : (
                  <Elements
                    key={clientSecret}
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
                )}
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
