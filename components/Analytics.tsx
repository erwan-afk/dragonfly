'use client';

import Script from 'next/script';
import { useEffect } from 'react';
import { useCookieConsent, type ConsentState } from '@/lib/cookie-consent';

const GA_ID = 'G-RK70FL3JC8';

export default function Analytics() {
  const { consent, hydrated } = useCookieConsent();

  if (!hydrated) return null;

  return (
    <>
      <Script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('consent', 'default', {
            'ad_storage': 'denied',
            'ad_user_data': 'denied',
            'ad_personalization': 'denied',
            'analytics_storage': 'denied'
          });
          gtag('config', '${GA_ID}', { anonymize_ip: true });
        `}
      </Script>
      <ConsentUpdater consent={consent} />
    </>
  );
}

function ConsentUpdater({ consent }: { consent: ConsentState | null }) {
  useEffect(() => {
    const gtag = (window as any).gtag as
      | ((
          command: string,
          action: string,
          params: Record<string, string>
        ) => void)
      | undefined;
    if (!gtag) return;

    if (consent?.analytics) {
      gtag('consent', 'update', { analytics_storage: 'granted' });
    } else {
      gtag('consent', 'update', { analytics_storage: 'denied' });
    }
  }, [consent]);

  return null;
}
