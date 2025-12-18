import { Metadata } from 'next';
import { ReactNode, Suspense } from 'react';
import Footer from '@/components/ui/Footer';
import Navbar from '@/components/ui/Navbar';
import { getURL } from '@/utils/helpers';
import 'styles/main.css';
import { HeroUIProvider } from '@heroui/system';
import { LoadingProvider } from '@/components/ui/LoadingProvider';
import { ToastProvider } from '@/components/ui/Toast';

const meta = {
  title: 'Next.js Subscription Starter',
  description: 'Brought to you by Vercel, Stripe, and Better Auth.',
  cardImage: '/og.png',
  robots: 'follow, index',
  favicon: '/favicon.ico',
  url: getURL()
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: meta.title,
    description: meta.description,
    referrer: 'origin-when-cross-origin',
    keywords: [
      'Vercel',
      'Better Auth',
      'Next.js',
      'Stripe',
      'Subscription',
      'Prisma'
    ],
    authors: [{ name: 'Vercel', url: 'https://vercel.com/' }],
    creator: 'Vercel',
    publisher: 'Vercel',
    robots: meta.robots,
    icons: { icon: meta.favicon },
    metadataBase: new URL(meta.url),
    openGraph: {
      url: meta.url,
      title: meta.title,
      description: meta.description,
      images: [meta.cardImage],
      type: 'website',
      siteName: meta.title
    },
    twitter: {
      card: 'summary_large_image',
      site: '@Vercel',
      creator: '@Vercel',
      title: meta.title,
      description: meta.description,
      images: [meta.cardImage]
    }
  };
}

interface LayoutsProps {
  children: ReactNode;
  className?: string;
}

export default function RootLayout({ children, className }: LayoutsProps) {
  return (
    <html lang="en">
      <body className="w-full relative bg-fullwhite">
        <HeroUIProvider>
          <LoadingProvider>
            <ToastProvider>
              <main className="w-full relative min-h-screen">
                <div className="w-full bg-darkgrey text-center text-fullwhite py-8 text-[12px] flex flex-row justify-center items-center gap-8">
                  <span>The Automated Marketplace You've Been Waiting For</span>
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
                <div className="w-full xl:gap-75 gap-50 p-25 transition-all ease-in-out duration-200 min-h-[60vh]">
                  <Suspense
                    fallback={
                      <div className="w-full min-h-[60vh] bg-fullwhite" />
                    }
                  >
                    {children}
                  </Suspense>
                </div>
                <Footer />
              </main>
            </ToastProvider>
          </LoadingProvider>
        </HeroUIProvider>
      </body>
    </html>
  );
}
