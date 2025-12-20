import Lenis from 'lenis';

// Utility function to scroll to an element with Lenis
export const scrollToElement = (target: string | HTMLElement, offset: number = 0) => {
  const lenis = (window as any).lenis as Lenis;

  if (!lenis) {
    console.warn('Lenis not initialized');
    return;
  }

  if (typeof target === 'string') {
    const element = document.querySelector(target) as HTMLElement;
    if (element) {
      lenis.scrollTo(element, { offset });
    }
  } else {
    lenis.scrollTo(target, { offset });
  }
};

// Hook for smooth scrolling (can be used in components)
export const useSmoothScroll = () => {
  return {
    scrollToElement,
    scrollToTop: () => scrollToElement(document.body),
    scrollTo: (target: string | HTMLElement) => scrollToElement(target),
  };
};
