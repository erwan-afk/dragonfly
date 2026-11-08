'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { readBackTarget } from './back-target';

interface BackLinkProps {
  fallbackHref: string;
  fallbackLabel: string;
  className?: string;
}

// The page linking here records where the visitor came from (see
// RememberedLink) instead of adding a ?from= query string: query variants
// create duplicate URLs that search engines index separately. A legacy
// ?from= in an old link is still honoured.
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
  const pathname = usePathname();
  const [remembered, setRemembered] = useState<string | null>(null);

  useEffect(() => {
    setRemembered(readBackTarget(pathname));
  }, [pathname]);

  const legacy = searchParams.get('from');
  const from =
    remembered ?? (legacy && legacy.startsWith('/') ? legacy : null);

  const href = from ?? fallbackHref;
  const label = from ? labelFor(from) : fallbackLabel;

  return (
    <a href={href} className={className}>
      ← {label}
    </a>
  );
}
