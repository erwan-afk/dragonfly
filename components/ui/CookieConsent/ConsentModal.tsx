'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ConsentState } from '@/lib/cookie-consent';

type Toggles = { analytics: boolean; marketing: boolean };

interface ConsentModalProps {
  open: boolean;
  initial: ConsentState | null;
  onClose: () => void;
  onSave: (next: Toggles) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
}

export default function ConsentModal({
  open,
  initial,
  onClose,
  onSave,
  onAcceptAll,
  onRejectAll
}: ConsentModalProps) {
  const [toggles, setToggles] = useState<Toggles>({
    analytics: initial?.analytics ?? false,
    marketing: initial?.marketing ?? false
  });

  useEffect(() => {
    if (open) {
      setToggles({
        analytics: initial?.analytics ?? false,
        marketing: initial?.marketing ?? false
      });
    }
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-darkgrey/60 backdrop-blur-sm px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-fullwhite rounded-16 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-24 py-20 border-b border-stonegrey/20 flex items-center justify-between">
          <h2
            id="consent-modal-title"
            className="text-oceanblue text-20 font-medium"
          >
            Cookie preferences
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-darkgrey hover:text-oceanblue text-24 leading-none cursor-pointer"
          >
            ×
          </button>
        </div>

        <div className="px-24 py-16 overflow-y-auto flex flex-col gap-16 text-oceanblue">
          <p className="text-14 text-darkgrey">
            We use cookies to make the site work, measure audience, and improve
            our services. You can accept or refuse non-essential cookies and
            change your choice at any time from the footer. See our{' '}
            <Link href="/policies" className="underline hover:text-articblue">
              Cookie Policy
            </Link>{' '}
            for details.
          </p>

          <Category
            title="Essential"
            description="Required for the site to work: authentication session, security (CSRF, anti-spam reCAPTCHA), and your cookie choices. Cannot be disabled."
            checked
            disabled
          />

          <Category
            title="Analytics"
            description="Google Analytics. Helps us understand how visitors use the site (pages viewed, traffic sources) so we can improve it. Anonymous data."
            checked={toggles.analytics}
            onChange={(v) => setToggles((t) => ({ ...t, analytics: v }))}
          />

          <Category
            title="Marketing"
            description="Reserved for future advertising features. Currently no marketing cookies are set."
            checked={toggles.marketing}
            onChange={(v) => setToggles((t) => ({ ...t, marketing: v }))}
          />
        </div>

        <div className="px-24 py-16 border-t border-stonegrey/20 flex flex-col-reverse sm:flex-row sm:justify-between gap-8">
          <button
            type="button"
            onClick={() => {
              onRejectAll();
              onClose();
            }}
            className="px-16 py-8 rounded-full border border-stonegrey/40 text-oceanblue text-14 font-medium hover:bg-lightgrey transition-colors cursor-pointer"
          >
            Reject all
          </button>
          <div className="flex flex-col sm:flex-row gap-8">
            <button
              type="button"
              onClick={() => {
                onSave(toggles);
                onClose();
              }}
              className="px-16 py-8 rounded-full border border-articblue text-articblue text-14 font-medium hover:bg-articblue/10 transition-colors cursor-pointer"
            >
              Save my choices
            </button>
            <button
              type="button"
              onClick={() => {
                onAcceptAll();
                onClose();
              }}
              className="px-16 py-8 rounded-full bg-articblue text-fullwhite text-14 font-medium hover:bg-oceanblue transition-colors cursor-pointer"
            >
              Accept all
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Category({
  title,
  description,
  checked,
  disabled,
  onChange
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-16 p-16 rounded-12 border border-stonegrey/20 bg-fullwhite">
      <div className="flex flex-col gap-4">
        <div className="text-16 font-medium text-oceanblue">{title}</div>
        <p className="text-13 text-darkgrey leading-snug">{description}</p>
      </div>
      <Toggle
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        ariaLabel={title}
      />
    </div>
  );
}

function Toggle({
  checked,
  disabled,
  onChange,
  ariaLabel
}: {
  checked: boolean;
  disabled?: boolean;
  onChange?: (v: boolean) => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => !disabled && onChange?.(!checked)}
      className={`relative inline-flex h-[28px] w-[48px] shrink-0 items-center rounded-full transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-articblue focus-visible:ring-offset-2 ${
        checked ? 'bg-articblue' : 'bg-stonegrey/50'
      } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-[22px] w-[22px] transform rounded-full bg-fullwhite shadow ring-0 transition-transform duration-200 ${
          checked ? 'translate-x-[23px]' : 'translate-x-[3px]'
        }`}
      />
    </button>
  );
}
