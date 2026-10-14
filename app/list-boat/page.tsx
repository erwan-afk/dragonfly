import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/utils/auth/auth';
import ListBoatClient from './ListBoatClient';
import { getProductsFromDatabase } from '@/utils/database/products';

export default async function ListBoatPage({
  searchParams
}: {
  searchParams?: { preference?: string; boatId?: string };
}) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  const preference = searchParams?.preference || null;
  // Renewal links from emails carry the listing to pre-select
  const boatId = searchParams?.boatId || null;

  if (!session?.user) {
    const query = new URLSearchParams();
    if (preference) query.set('preference', preference);
    if (boatId) query.set('boatId', boatId);
    const callbackUrl = query.size ? `/list-boat?${query}` : '/list-boat';
    redirect(`/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  const products = await getProductsFromDatabase();

  return (
    <ListBoatClient
      user={session.user as any}
      preference={preference}
      initialBoatId={boatId}
      products={products as any[]}
    />
  );
}
