import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/utils/auth/auth';
import ListBoatClient from './ListBoatClient';
import { getProductsFromDatabase } from '@/utils/database/products';

export default async function ListBoatPage({
  searchParams
}: {
  searchParams?: { preference?: string };
}) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  const preference = searchParams?.preference || null;

  if (!session?.user) {
    const callbackUrl = preference
      ? `/list-boat?preference=${encodeURIComponent(preference)}`
      : '/list-boat';
    redirect(`/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  const products = await getProductsFromDatabase();

  return (
    <ListBoatClient
      user={session.user as any}
      preference={preference}
      products={products as any[]}
    />
  );
}
