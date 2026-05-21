import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/utils/auth/auth';
import prisma from '@/utils/prisma/client';
import BoostClient from './BoostClient';

export const dynamic = 'force-dynamic';

interface BoostPageProps {
  params: { boatId: string };
}

export default async function BoostPage({ params }: BoostPageProps) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect('/signin/password_signin');
  }

  const boat = await prisma.boat.findFirst({
    where: { id: params.boatId, userId: session.user.id },
    select: {
      id: true,
      model: true,
      price: true,
      currency: true,
      country: true,
      status: true,
      boostExpiresAt: true
    }
  });

  if (!boat) {
    redirect(
      '/account?status=Error&status_description=Boat not found or unauthorized'
    );
  }

  if (boat.status !== 'active') {
    redirect(
      '/account?status=Error&status_description=Only active listings can be boosted'
    );
  }

  if (boat.boostExpiresAt && boat.boostExpiresAt.getTime() > Date.now()) {
    redirect(
      '/account?status=Info&status_description=This listing already has an active boost'
    );
  }

  const serializedBoat = {
    id: boat.id,
    model: boat.model,
    price: parseFloat(boat.price.toString()),
    currency: boat.currency,
    country: boat.country
  };

  return <BoostClient boat={serializedBoat} />;
}
