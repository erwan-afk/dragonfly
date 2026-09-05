'use client';

// Central helpers for pushing business events into the GTM dataLayer.
// GTM-NKCXLKQ6 must forward these events to GA4 via its own tag/trigger
// config — this file only owns the shape and dedupe of what gets pushed.
// Never include PII (email, name, phone, message) in any event payload.

export type TransactionType = 'new_listing' | 'renewal' | 'upgrade';

interface PromotionEventParams {
  plan_name: string;
  transaction_type: TransactionType;
  value: number;
  currency: string;
}

interface PurchaseEventParams extends PromotionEventParams {
  transaction_id: string;
}

interface GenerateLeadParams {
  listing_id: string;
  model: string;
  country: string;
}

function pushToDataLayer(event: string, params: object) {
  if (typeof window === 'undefined') return;
  (window as any).dataLayer = (window as any).dataLayer || [];
  (window as any).dataLayer.push({ event, ...params });
}

const PURCHASE_DEDUPE_KEY = 'gtm_purchase_transaction_ids';

function hasPurchaseBeenTracked(transactionId: string): boolean {
  try {
    const raw = window.localStorage.getItem(PURCHASE_DEDUPE_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    return ids.includes(transactionId);
  } catch {
    return false;
  }
}

function markPurchaseTracked(transactionId: string) {
  try {
    const raw = window.localStorage.getItem(PURCHASE_DEDUPE_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    if (!ids.includes(transactionId)) {
      window.localStorage.setItem(
        PURCHASE_DEDUPE_KEY,
        JSON.stringify([...ids, transactionId].slice(-50))
      );
    }
  } catch {
    // Ignore storage errors (private browsing, quota, etc.) — worst case
    // is a duplicate push, which GA4 also dedupes server-side by
    // transaction_id for purchase events.
  }
}

export function trackSelectPromotion(params: PromotionEventParams) {
  pushToDataLayer('select_promotion', params);
}

export function trackBeginCheckout(params: PromotionEventParams) {
  pushToDataLayer('begin_checkout', params);
}

/** Only call this after Stripe has confirmed the payment succeeded. */
export function trackPurchase(params: PurchaseEventParams) {
  if (typeof window === 'undefined') return;
  if (hasPurchaseBeenTracked(params.transaction_id)) return;
  markPurchaseTracked(params.transaction_id);
  pushToDataLayer('purchase', params);
}

export function trackGenerateLead(params: GenerateLeadParams) {
  pushToDataLayer('generate_lead', params);
}
