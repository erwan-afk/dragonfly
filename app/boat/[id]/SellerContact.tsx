'use client';

import { useRef, useState } from 'react';
import { trackGenerateLead } from '@/lib/gtm';

interface SellerContactProps {
  listingId: string;
  model: string;
  country: string;
  email: string;
}

export function SellerContact({
  listingId,
  model,
  country,
  email
}: SellerContactProps) {
  const [copied, setCopied] = useState(false);
  const hasTrackedLead = useRef(false);

  const handleContactIntent = async () => {
    if (!hasTrackedLead.current) {
      hasTrackedLead.current = true;
      trackGenerateLead({ listing_id: listingId, model, country });
    }

    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — the email is still visible for manual copy.
    }
  };

  return (
    <div className="text-darkgrey text-14">
      <span className="font-medium">Mail : </span>
      <a
        href={`mailto:${email}`}
        onClick={handleContactIntent}
        className="break-all hover:text-articblue transition-colors"
      >
        {email}
      </a>
      <button
        type="button"
        onClick={handleContactIntent}
        className="ml-2 text-articblue text-12 hover:underline"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}
