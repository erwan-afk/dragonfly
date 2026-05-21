'use client';

import { openConsentSettings } from '@/lib/cookie-consent';

export default function CookieSettingsButton() {
  return (
    <button
      type="button"
      onClick={() => openConsentSettings()}
      className="w-fit font-light text-white hover:underline text-left cursor-pointer bg-transparent border-0 p-0"
    >
      Cookie settings
    </button>
  );
}
