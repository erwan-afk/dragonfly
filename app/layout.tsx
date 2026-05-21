import { Metadata } from 'next';
import { ReactNode, Suspense } from 'react';
import Footer from '@/components/ui/Footer';
import Navbar from '@/components/ui/Navbar';
import { getURL } from '@/utils/helpers';
import 'styles/main.css';
import { HeroUIProvider } from '@heroui/system';
import { LoadingProvider } from '@/components/ui/LoadingProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { ReCaptchaProvider } from 'next-recaptcha-v3';
import NavigationLoader from '@/components/ui/NavigationLoader';
import SurveyWidget from '@/components/ui/SurveyWidget/SurveyWidget';
import CookieConsent from '@/components/ui/CookieConsent/CookieConsent';
import Analytics from '@/components/Analytics';

const meta = {
  title: "Dragonfly - The Automated Marketplace You've Been Waiting For",
  description:
    'Transform your business with our automated marketplace platform. Streamline workflows, boost productivity, and scale effortlessly with AI-powered automation tools.',
  cardImage: '/images/dragonfly-boat.webp',
  robots: 'follow, index',
  favicon: '/favicon.ico',
  url: getURL(),
  locale: 'en_US',
  type: 'website',
  siteName: 'Dragonfly'
};

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = meta.url;
  const canonicalUrl = baseUrl;

  return {
    title: {
      default: meta.title,
      template: '%s | Dragonfly'
    },
    description: meta.description,
    keywords: [
      'boats for sale',
      'boats for rent',
      'boats for charter',
      'boats for sale',
      'boats for rent',
      'boats for charter',
      'boats for sale',
      'boats for rent',
      'boats for charter',
      'marketplace',
      'digital marketplace',
      'business automation'
    ],
    authors: [{ name: 'Dragonfly Team' }],
    creator: 'Dragonfly',
    publisher: 'Dragonfly',
    formatDetection: {
      email: false,
      address: false,
      telephone: false
    },
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: canonicalUrl
    },
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        noimageindex: false,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1
      }
    },
    icons: {
      icon: meta.favicon,
      shortcut: meta.favicon,
      apple: meta.favicon
    },
    manifest: '/manifest.json',
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: canonicalUrl,
      title: meta.title,
      description: meta.description,
      siteName: 'Dragonfly',
      images: [
        {
          url: meta.cardImage,
          width: 1200,
          height: 630,
          alt: 'Dragonfly - The Automated Marketplace'
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      site: '@dragonfly',
      creator: '@dragonfly',
      title: meta.title,
      description: meta.description,
      images: [meta.cardImage]
    },
    verification: {
      google: 'your-google-site-verification-code',
      yandex: 'your-yandex-verification-code',
      other: {
        'msvalidate.01': 'your-bing-verification-code'
      }
    },
    category: 'technology'
  };
}

interface LayoutsProps {
  children: ReactNode;
}

// Structured Data for SEO
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Dragonfly',
  description: "The Automated Marketplace You've Been Waiting For",
  url: meta.url,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${meta.url}/search?q={search_term_string}`
    },
    'query-input': 'required name=search_term_string'
  },
  publisher: {
    '@type': 'Organization',
    name: 'Dragonfly',
    url: meta.url,
    logo: {
      '@type': 'ImageObject',
      url: `${meta.url}/logo.png`
    }
  }
};

export default function RootLayout({ children }: LayoutsProps) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData)
          }}
        />
      </head>
      <body className="w-full relative bg-fullwhite overflow-x-hidden">
        <Analytics />
        <HeroUIProvider>
          <LoadingProvider>
            <ToastProvider>
              <ReCaptchaProvider>
                <NavigationLoader />
                <main className="w-full relative min-h-screen">
                  <div className="w-full bg-darkgrey text-center text-fullwhite py-8 text-[10px] xs:text-[12px] flex flex-row justify-center items-center gap-4 xs:gap-8 px-8 xs:px-16">
                    <span className="hidden sm:inline">
                      The Automated Marketplace You've Been Waiting For
                    </span>
                    <span className="sm:hidden">Automated Marketplace</span>
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 13 13"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect
                        x="0.3"
                        y="0.3"
                        width="12.4"
                        height="12.3531"
                        rx="6.17656"
                        fill="#26282A"
                      />
                      <rect
                        x="0.3"
                        y="0.3"
                        width="12.4"
                        height="12.3531"
                        rx="6.17656"
                        stroke="white"
                        strokeWidth="0.6"
                      />
                      <path
                        d="M6.7432 10H6.0432V4.73H6.7432V10ZM6.9532 3.51C6.9532 3.66333 6.89987 3.79 6.7932 3.89C6.6932 3.99 6.55654 4.04 6.3832 4.04C6.2232 4.04 6.08987 3.99 5.9832 3.89C5.87654 3.79 5.8232 3.66333 5.8232 3.51C5.8232 3.35667 5.87654 3.23333 5.9832 3.14C6.08987 3.04 6.2232 2.99 6.3832 2.99C6.55654 2.99 6.6932 3.04 6.7932 3.14C6.89987 3.23333 6.9532 3.35667 6.9532 3.51Z"
                        fill="white"
                      />
                    </svg>
                  </div>

                  <Navbar />
                  <div className="w-full xl:gap-75 gap-50  xs:px-16 md:p-25 2xl:p-0 transition-all ease-in-out duration-200 min-h-[60vh]">
                    <Suspense
                      fallback={
                        <div className="w-full min-h-[60vh] bg-fullwhite" />
                      }
                    >
                      {children}
                    </Suspense>
                  </div>
                  <Footer />
                  <CookieConsent />
                  <SurveyWidget />
                </main>
              </ReCaptchaProvider>
            </ToastProvider>
          </LoadingProvider>
        </HeroUIProvider>
      </body>
    </html>
  );
}
