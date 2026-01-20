'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';

interface SmoothScrollProps {
  children: ReactNode;
}

export default function SmoothScroll({ children }: SmoothScrollProps) {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    // Initialize Lenis
    lenisRef.current = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: 2,
      infinite: false,
      autoResize: true
    });

    // Expose lenis instance globally
    (window as any).lenis = lenisRef.current;

    // Start the animation loop
    function raf(time: number) {
      lenisRef.current?.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // Cleanup on unmount
    return () => {
      lenisRef.current?.destroy();
      (window as any).lenis = null;
    };
  }, []);

  // Reset scroll and resize on route change
  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
      // Force resize after a small delay to ensure DOM is updated
      setTimeout(() => {
        lenisRef.current?.resize();
      }, 100);
    }
  }, [pathname]);

  // Observe DOM changes to trigger resize when content changes (images loading, etc.)
  useEffect(() => {
    if (!lenisRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      lenisRef.current?.resize();
    });

    resizeObserver.observe(document.body);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return <>{children}</>;
}
