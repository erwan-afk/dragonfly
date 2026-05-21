'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { ArrowLeft, CheckCircle, Image as ImageIcon, Film } from 'lucide-react';
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
      const { error: submitError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/account?payment=success`
        },
        redirect: 'if_required'
      });
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
              <CheckCircle size={18} />
              Confirm purchase
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default function ExtrasClient({
  boat,
  photoPrice,
  videoPrice
}: ExtrasClientProps) {
  const router = useRouter();
  const [selectPhotos, setSelectPhotos] = useState(false);
  const [selectVideo, setSelectVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoUrlError, setVideoUrlError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [currency, setCurrency] = useState<string>('eur');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const photoAvailable = !boat.hasExtraPhotos;
  const videoAvailable = !boat.videoUrl;

  const total =
    (selectPhotos && photoPrice ? photoPrice.amount : 0) +
    (selectVideo && videoPrice ? videoPrice.amount : 0);

  const canCheckout =
    (selectPhotos || selectVideo) &&
    !(selectVideo && !isValidVideoUrl(videoUrl));

  const handleProceed = async () => {
    setIsLoading(true);
    setError(null);
    setVideoUrlError(null);

    if (selectVideo && !isValidVideoUrl(videoUrl)) {
      setVideoUrlError(
        'Enter a valid YouTube, Vimeo or Dailymotion URL.'
      );
      setIsLoading(false);
      return;
    }

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
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccess = () => {
    router.push(
      '/account?status=Success&status_description=Add-ons activated on your listing.'
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
        <h1 className="text-xl md:text-3xl font-bold text-articblue py-16">
          Add extras
        </h1>
      </div>

      <div className="bg-gray-50 rounded-xl p-6 mb-8 border">
        <div className="text-sm text-gray-500 mb-2">Listing</div>
        <div className="text-lg md:text-xl font-semibold text-oceanblue">
          {getModelLabel(boat.model)}
        </div>
        <div className="text-gray-600">
          {formatPriceNumber(boat.price, boat.currency)} {boat.currency} - {boat.country}
        </div>
      </div>

      {!clientSecret ? (
        <div className="flex flex-col gap-4">
          {/* Extra photos card */}
          <div
            className={`border-2 rounded-xl p-5 transition-colors ${
              !photoAvailable
                ? 'border-gray-200 bg-gray-50 opacity-70'
                : selectPhotos
                  ? 'border-articblue bg-articblue/5'
                  : 'border-gray-200 hover:border-articblue/40'
            }`}
          >
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                disabled={!photoAvailable}
                checked={selectPhotos}
                onChange={(e) => setSelectPhotos(e.target.checked)}
                className="mt-1.5 w-5 h-5 accent-articblue"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-medium text-oceanblue">
                    <ImageIcon size={18} className="text-articblue" />
                    +5 extra photos
                  </div>
                  {photoPrice && (
                    <span className="font-bold text-articblue">
                      {(photoPrice.amount / 100).toFixed(2)}{' '}
                      {photoPrice.currency.toUpperCase()}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {photoAvailable
                    ? 'Add 5 extra photo slots to your listing.'
                    : 'Already added to this listing.'}
                </p>
              </div>
            </label>
          </div>

          {/* Video card */}
          <div
            className={`border-2 rounded-xl p-5 transition-colors ${
              !videoAvailable
                ? 'border-gray-200 bg-gray-50 opacity-70'
                : selectVideo
                  ? 'border-articblue bg-articblue/5'
                  : 'border-gray-200 hover:border-articblue/40'
            }`}
          >
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                disabled={!videoAvailable}
                checked={selectVideo}
                onChange={(e) => setSelectVideo(e.target.checked)}
                className="mt-1.5 w-5 h-5 accent-articblue"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-medium text-oceanblue">
                    <Film size={18} className="text-articblue" />
                    Video link
                  </div>
                  {videoPrice && (
                    <span className="font-bold text-articblue">
                      {(videoPrice.amount / 100).toFixed(2)}{' '}
                      {videoPrice.currency.toUpperCase()}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {videoAvailable
                    ? 'Embed a YouTube, Vimeo or Dailymotion video on your listing.'
                    : 'Already added to this listing.'}
                </p>
              </div>
            </label>
            {selectVideo && (
              <div className="mt-3">
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => {
                    setVideoUrl(e.target.value);
                    setVideoUrlError(null);
                  }}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-articblue"
                />
                {videoUrlError && (
                  <p className="text-sm text-red-600 mt-1">{videoUrlError}</p>
                )}
                {!videoUrlError && videoUrl && !isValidVideoUrl(videoUrl) && (
                  <p className="text-sm text-orange-600 mt-1">
                    Must be a valid YouTube, Vimeo or Dailymotion URL.
                  </p>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 rounded-xl p-4 border border-red-200 text-red-700">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="text-gray-700">
              Total:{' '}
              <span className="font-bold text-articblue text-lg">
                {(total / 100).toFixed(2)} EUR
              </span>
            </div>
            <button
              onClick={handleProceed}
              disabled={!canCheckout || isLoading}
              className="py-3 px-6 bg-articblue text-white rounded-lg hover:bg-oceanblue transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Preparing...
                </>
              ) : (
                'Continue to payment'
              )}
            </button>
          </div>
        </div>
      ) : amount ? (
        <div className="bg-white rounded-xl p-6 border">
          <div className="mb-4 pb-4 border-b">
            <div className="flex justify-between items-center">
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
              onCancel={() => {
                setClientSecret(null);
                setAmount(null);
              }}
            />
          </Elements>
        </div>
      ) : null}
    </section>
  );
}
