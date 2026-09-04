import { Suspense } from 'react';
import ForumSection from '@/components/ForumSection';
import { getURL } from '@/utils/helpers';

// Désactiver le rendu statique - cette page doit être rendue dynamiquement
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Forum - 3Hulls',
  description:
    'Engage with fellow trimaran enthusiasts, share insights, and get answers to your questions about sailing, maintenance, and more.',
  alternates: { canonical: getURL('/forum') }
};

export default function ForumPage() {
  return (
    <div className="min-h-screen">
      <Suspense
        fallback={<div className="p-8 text-center">Chargement du forum...</div>}
      >
        <ForumSection />
      </Suspense>
    </div>
  );
}
