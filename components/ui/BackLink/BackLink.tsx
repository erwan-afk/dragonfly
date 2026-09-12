'use client';

import { useSearchParams } from 'next/navigation';

interface BackLinkProps {
  fallbackHref: string;
  fallbackLabel: string;
  className?: string;
}

// `from` is passed explicitly as a query param by the page linking here
// (e.g. the boat listing's "View model page" link) rather than read from
// document.referrer — Next.js client-side navigation never updates the
// browser referrer, so that approach silently never worked.
function labelFor(from: string): string {
  if (from.startsWith('/boat/')) return 'Back to listing';
  if (from.startsWith('/forsale')) return 'Back to results';
  return 'Back';
}

export default function BackLink({
  fallbackHref,
  fallbackLabel,
  className
}: BackLinkProps) {
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const isSafeFrom = !!from && from.startsWith('/');

  const href = isSafeFrom ? from : fallbackHref;
  const label = isSafeFrom ? labelFor(from) : fallbackLabel;

  return (
    <a href={href} className={className}>
      ← {label}
    </a>
  );
}
