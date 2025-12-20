'use client';

import React, {
  forwardRef,
  useImperativeHandle,
  useEffect,
  useState
} from 'react';

// Extend window interface for reCAPTCHA v3
declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (
        siteKey: string,
        options?: { action?: string }
      ) => Promise<string>;
    };
  }
}

export interface ReCAPTCHARef {
  executeAsync: () => Promise<string | null>;
  reset: () => void;
}

interface ReCAPTCHAProps {
  sitekey?: string;
  onChange?: (token: string | null) => void;
  onError?: () => void;
}

const ReCAPTCHAComponent = forwardRef<ReCAPTCHARef, ReCAPTCHAProps>(
  (
    { sitekey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY, onChange, onError },
    ref
  ) => {
    const [isReady, setIsReady] = useState(false);
    const [scriptLoaded, setScriptLoaded] = useState(false);

    // Load reCAPTCHA v3 script
    useEffect(() => {
      if (typeof window === 'undefined' || scriptLoaded) return;

      // Check if script is already loaded
      const existingScript = document.querySelector(
        'script[src*="recaptcha/api.js"]'
      );
      if (existingScript) {
        setScriptLoaded(true);
        if (window.grecaptcha) {
          window.grecaptcha.ready(() => setIsReady(true));
        }
        return;
      }

      // Ensure sitekey is available before loading script
      if (!sitekey) {
        console.warn('reCAPTCHA site key not available');
        return;
      }

      const script = document.createElement('script');
      // Use render parameter for v3 to ensure no visible widget is shown
      script.src = `https://www.google.com/recaptcha/api.js?render=${sitekey}`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        setScriptLoaded(true);
        if (window.grecaptcha) {
          window.grecaptcha.ready(() => setIsReady(true));
        }
      };

      script.onerror = () => {
        console.error('Failed to load reCAPTCHA v3 script');
        onError?.();
      };

      document.head.appendChild(script);

      return () => {
        // Cleanup is handled automatically by react-google-recaptcha when component unmounts
      };
    }, [sitekey, scriptLoaded, onError]);

    useImperativeHandle(ref, () => ({
      executeAsync: async () => {
        if (!isReady || !window.grecaptcha || !sitekey) {
          console.error('reCAPTCHA v3 not ready');
          return null;
        }

        try {
          const token = await window.grecaptcha.execute(sitekey, {
            action: 'signup'
          });
          onChange?.(token);
          return token;
        } catch (error) {
          console.error('reCAPTCHA v3 execution failed:', error);
          onError?.();
          return null;
        }
      },
      reset: () => {
        // reCAPTCHA v3 doesn't need reset - tokens are single-use
        console.log('reCAPTCHA v3 reset called (no-op)');
      }
    }));

    if (!sitekey) {
      console.warn(
        'reCAPTCHA site key not found. Make sure NEXT_PUBLIC_RECAPTCHA_SITE_KEY is set.'
      );
      return null;
    }

    // reCAPTCHA v3 is invisible - no UI needed
    return null;
  }
);

ReCAPTCHAComponent.displayName = 'ReCAPTCHA';

export default ReCAPTCHAComponent;
