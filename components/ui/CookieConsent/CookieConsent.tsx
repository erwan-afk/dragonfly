'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CONSENT_OPEN_EVENT,
  acceptAll,
  rejectAll,
  setStoredConsent,
  useCookieConsent
} from '@/lib/cookie-consent';
import ConsentModal from './ConsentModal';

export default function CookieConsent() {
  const { consent, hydrated, hasConsented } = useCookieConsent();
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const onOpen = () => setModalOpen(true);
    window.addEventListener(CONSENT_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, onOpen);
  }, []);

  if (!hydrated) return null;

  const showBanner = !hasConsented && !modalOpen;

  return (
    <>
      {showBanner && (
        <div
          role="region"
          aria-label="Cookie consent"
          className="fixed bottom-0 left-0 right-0 z-[90] px-4 pb-4 sm:px-8 sm:pb-8"
        >
          <div className="mx-auto max-w-screen-xl bg-fullwhite text-oceanblue rounded-16 shadow-2xl border border-stonegrey/20 p-16 sm:p-24 flex flex-col lg:flex-row gap-16 lg:items-center lg:justify-between">
            <div className="text-14 lg:text-15 leading-relaxed lg:max-w-2xl">
              We use cookies to operate this site, measure audience, and improve
              your experience. You can accept all, refuse all, or customize
              your choice. Read our{' '}
              <Link
                href="/policies"
                className="underline hover:text-articblue"
              >
                Cookie Policy
              </Link>
              .
            </div>
            <div className="flex flex-col sm:flex-row gap-8 lg:shrink-0">
              <button
                type="button"
                onClick={() => rejectAll()}
                className="px-16 py-8 rounded-full border border-stonegrey/40 text-oceanblue text-14 font-medium hover:bg-lightgrey transition-colors cursor-pointer"
              >
                Reject all
              </button>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="px-16 py-8 rounded-full border border-articblue text-articblue text-14 font-medium hover:bg-articblue/10 transition-colors cursor-pointer"
              >
                Customize
              </button>
              <button
                type="button"
                onClick={() => acceptAll()}
                className="px-16 py-8 rounded-full bg-articblue text-fullwhite text-14 font-medium hover:bg-oceanblue transition-colors cursor-pointer"
              >
                Accept all
              </button>
            </div>
          </div>
        </div>
      )}

      <ConsentModal
        open={modalOpen}
        initial={consent}
        onClose={() => setModalOpen(false)}
        onSave={(next) => setStoredConsent(next)}
        onAcceptAll={() => acceptAll()}
        onRejectAll={() => rejectAll()}
      />
    </>
  );
}
