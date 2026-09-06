'use client';

import { useRef } from 'react';
import { trackGenerateLead } from '@/lib/gtm';

interface SellerContactProps {
  listingId: string;
  model: string;
  country: string;
  email: string | null;
}

export function SellerContact({ listingId, model, country, email }: SellerContactProps) {
  const hasTrackedLead = useRef(false);

  if (!email) {
    return (
      <div className="w-full text-center text-14 text-[#8b979d] border border-[#dde3e7] rounded-[10px] py-[13px]">
        Contact unavailable
      </div>
    );
  }

  const handleClick = () => {
    if (!hasTrackedLead.current) {
      hasTrackedLead.current = true;
      trackGenerateLead({ listing_id: listingId, model, country });
    }
    window.location.href = `mailto:${email}`;
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full bg-[#3fada6] text-fullwhite text-14 font-bold rounded-[10px] py-[13px] hover:opacity-90 transition-opacity"
    >
      Contact seller
    </button>
  );
}
