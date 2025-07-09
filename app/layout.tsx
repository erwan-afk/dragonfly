import { Metadata } from 'next';
import { PropsWithChildren, ReactNode } from 'react';
import Footer from '@/components/ui/Footer';
import Navbar from '@/components/ui/Navbar';
import { getURL } from '@/utils/helpers';
import 'styles/main.css';
import { HeroUIProvider } from '@heroui/system';
import { LoadingProvider } from '@/components/ui/LoadingProvider';

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
            <main className="w-full relative min-h-screen">
              <Navbar />
              <div className="w-full xl:gap-75 gap-50 p-25 transition-all ease-in-out duration-200">
                {children}
              </div>
              <Footer />
            </main>
          </LoadingProvider>
        </HeroUIProvider>
      </body>
    </html>
  );
}
