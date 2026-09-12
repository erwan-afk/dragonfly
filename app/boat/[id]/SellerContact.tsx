'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { trackGenerateLead } from '@/lib/gtm';

interface SellerContactProps {
  listingId: string;
  model: string;
  country: string;
  isLoggedIn: boolean;
}

export function SellerContact({ listingId, model, country, isLoggedIn }: SellerContactProps) {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasTrackedLead = useRef(false);

  const handleMessageSeller = async () => {
    if (!hasTrackedLead.current) {
      hasTrackedLead.current = true;
      trackGenerateLead({ listing_id: listingId, model, country });
    }

    if (!isLoggedIn) {
      router.push(`/signin?callbackUrl=${encodeURIComponent(`/boat/${listingId}`)}`);
      return;
    }

    setSending(true);
    setError(null);
    try {
      const res = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boatId: listingId })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Unable to contact this seller');
        return;
      }
      router.push(`/messages/${data.conversationId}`);
    } catch {
      setError('Something went wrong, please try again later.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <button
        type="button"
        onClick={handleMessageSeller}
        disabled={sending}
        className="w-full bg-[#3fada6] text-fullwhite text-14 font-bold rounded-[10px] py-[13px] hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {sending ? 'Contacting...' : 'Contact seller'}
      </button>
      {error && <p className="text-[12px] text-red-600">{error}</p>}
    </div>
  );
}
