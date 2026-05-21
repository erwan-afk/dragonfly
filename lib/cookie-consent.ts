'use client';

import { useEffect, useState, useCallback } from 'react';

export const CONSENT_STORAGE_KEY = 'cookie-consent';
export const CONSENT_VERSION = 1;
export const CONSENT_OPEN_EVENT = 'cookie-consent:open';
export const CONSENT_CHANGE_EVENT = 'cookie-consent:change';

export type ConsentCategory = 'analytics' | 'marketing';

export type ConsentState = {
  essential: true;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
  version: number;
};

const DEFAULT_REJECTED: ConsentState = {
  essential: true,
  analytics: false,
  marketing: false,
  timestamp: '',
  version: CONSENT_VERSION
};

export function getStoredConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentState;
    if (parsed.version !== CONSENT_VERSION) return null;
    return { ...parsed, essential: true };
  } catch {
    return null;
  }
}

export function setStoredConsent(
  next: Pick<ConsentState, 'analytics' | 'marketing'>
): ConsentState {
  const state: ConsentState = {
    essential: true,
    analytics: next.analytics,
    marketing: next.marketing,
    timestamp: new Date().toISOString(),
    version: CONSENT_VERSION
  };
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(
      new CustomEvent<ConsentState>(CONSENT_CHANGE_EVENT, { detail: state })
    );
  }
  return state;
}

export function clearStoredConsent(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(CONSENT_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT, { detail: null }));
}

export function openConsentSettings(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(CONSENT_OPEN_EVENT));
}

export function acceptAll(): ConsentState {
  return setStoredConsent({ analytics: true, marketing: true });
}

export function rejectAll(): ConsentState {
  return setStoredConsent({ analytics: false, marketing: false });
}

export function useCookieConsent() {
  const [consent, setConsent] = useState<ConsentState | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setConsent(getStoredConsent());
    setHydrated(true);

    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<ConsentState | null>).detail;
      setConsent(detail ?? getStoredConsent());
    };
    window.addEventListener(CONSENT_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_CHANGE_EVENT, onChange);
  }, []);

  const update = useCallback(
    (next: Pick<ConsentState, 'analytics' | 'marketing'>) => {
      const state = setStoredConsent(next);
      setConsent(state);
      return state;
    },
    []
  );

  return {
    consent,
    hydrated,
    hasConsented: consent !== null,
    setConsent: update,
    acceptAll,
    rejectAll,
    defaultRejected: DEFAULT_REJECTED
  };
}
