'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useLoading } from '../LoadingProvider';

export default function NavigationLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { startLoading, stopLoading } = useLoading();
  const isNavigatingRef = useRef(false);

  // Stop loading when route changes (navigation complete)
  useEffect(() => {
    if (isNavigatingRef.current) {
      stopLoading();
      isNavigatingRef.current = false;
    }
  }, [pathname, searchParams, stopLoading]);

  // Intercept internal link clicks to trigger loading
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');

      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      // Skip external links, anchors, and non-navigation links
      if (
        href.startsWith('http') ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        anchor.target === '_blank' ||
        anchor.hasAttribute('download')
      ) {
        return;
      }

      // Skip if modifier keys are pressed (new tab, etc.)
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

      // Skip if same path
      if (href === pathname) return;

      isNavigatingRef.current = true;
      startLoading();
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [pathname, startLoading]);

  return null;
}
