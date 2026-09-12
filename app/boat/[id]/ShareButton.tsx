'use client';

import { useState } from 'react';
import { Share2, Check } from 'lucide-react';

export function ShareButton() {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — nothing we can surface without a prompt.
    }
  };

  return (
    <button
      type="button"
      onClick={share}
      aria-label="Copy listing link"
      title={copied ? 'Link copied!' : 'Copy listing link'}
      className="w-[40px] h-[40px] rounded-full border border-[#dde3e7] bg-fullwhite flex items-center justify-center text-[#3a4a52] hover:bg-[#f7f9fa] transition-colors"
    >
      {copied ? <Check size={18} strokeWidth={2} color="#2c8a82" /> : <Share2 size={18} strokeWidth={2} />}
    </button>
  );
}
