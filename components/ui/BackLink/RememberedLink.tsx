'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { rememberBackTarget } from './back-target';

interface RememberedLinkProps {
  href: string;
  /** Page the visitor is leaving, offered as the "back" target on arrival. */
  backTo: string;
  className?: string;
  children: ReactNode;
}

/**
 * A clean, crawlable link (no ?from= query string, so search engines see a
 * single URL per page) that remembers where the visitor came from in
 * sessionStorage for BackLink to read.
 */
export default function RememberedLink({
  href,
  backTo,
  className,
  children
}: RememberedLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => rememberBackTarget(href, backTo)}
    >
      {children}
    </Link>
  );
}
