import { Suspense } from 'react';
import ForumSection from '@/components/ForumSection';

// Désactiver le rendu statique - cette page doit être rendue dynamiquement
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Forum - Dragonfly Trimarans',
  description:
    'Engage with fellow Dragonfly trimaran enthusiasts, share insights, and get answers to your questions about sailing, maintenance, and more.'
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
