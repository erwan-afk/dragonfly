'use client';

import Script from 'next/script';
import { useEffect } from 'react';
import { useCookieConsent, type ConsentState } from '@/lib/cookie-consent';

const GTM_ID = 'GTM-NKCXLKQ6';

export default function Analytics() {
  const { consent, hydrated } = useCookieConsent();

  if (!hydrated) return null;

  return (
    <>
      <Script id="google-consent-init" strategy="beforeInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('consent', 'default', {
            'ad_storage': 'denied',
            'ad_user_data': 'denied',
            'ad_personalization': 'denied',
            'analytics_storage': 'denied'
          });
        `}
      </Script>
      <Script id="google-tag-manager" strategy="afterInteractive">
        {`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${GTM_ID}');
        `}
      </Script>
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
          height="0"
          width="0"
          style={{ display: 'none', visibility: 'hidden' }}
        />
      </noscript>
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
