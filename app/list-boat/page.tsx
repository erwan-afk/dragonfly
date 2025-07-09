'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BoatListingForm from '@/components/ui/BoatListingForm/BoatListingForm';
import { useSession } from '@/lib/auth-client';
import BoatListingSkeleton from '@/components/ui/BoatListingSkeleton';

export default function ListBoatPage({
  searchParams
}: {
  searchParams?: { preference?: string };
}) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  console.log('🏠 ListBoatPage: Starting...');

  // Fix hydration mismatch by only showing loading state after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    if (isPending) {
      console.log('⏳ Authentication check pending...');
      return;
    }

    if (!session?.user) {
      console.log('❌ User not authenticated, redirecting to signin');
      router.push('/signin');
      return;
    }

    console.log('✅ User authenticated:', session.user.email);

    // Load products data
    const loadData = async () => {
      try {
        setIsLoading(true);
        console.log('🔍 Fetching products from API...');

        const response = await fetch('/api/products');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }

        setProducts(data.products);
        console.log('✅ ListBoatPage: Data fetched successfully');
        console.log('📊 Products found:', data.products.length);
      } catch (err) {
        console.error('❌ ListBoatPage: Error loading data:', err);
        setError('Error loading listing options. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [mounted, session, isPending, router]);

  // Show loading while checking authentication
  if (!mounted || isPending) {
    return <BoatListingSkeleton />;
  }

  // Don't render anything if user is not authenticated (will redirect)
  if (!session?.user) {
    return null;
  }

  // Show error state
  if (error) {
    return (
      <section className="bg-fullwhite h-[20vh] flex flex-col justify-center items-center">
        <p className="text-4xl font-extrabold text-oceanblue text-center mb-8">
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </section>
    );
  }

  const preference = searchParams?.preference || null;

  return (
    <section className="bg-fullwhite">
      <div className="max-w-screen-xl mx-auto py-[112px]">
        <Suspense fallback={<BoatListingSkeleton />}>
          {isLoading ? (
            <BoatListingSkeleton />
          ) : (
            <BoatListingForm
              user={session.user as any}
              products={products}
              preference={preference}
            />
          )}
        </Suspense>
      </div>
    </section>
  );
}
