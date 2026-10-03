import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/utils/auth/auth';
import prisma from '@/utils/prisma/client';
import ResumePaymentClient from './ResumePaymentClient';

export const dynamic = 'force-dynamic';

interface ResumePaymentPageProps {
  params: { boatId: string };
}

export default async function ResumePaymentPage({
  params
}: ResumePaymentPageProps) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user) {
    redirect(
      `/signin/password_signin?callbackUrl=${encodeURIComponent(`/resume-payment/${params.boatId}`)}`
    );
  }

  const { boatId } = params;

  const boat = await prisma.boat.findFirst({
    where: { id: boatId, userId: session.user.id },
    select: {
      id: true,
      model: true,
      price: true,
      currency: true,
      country: true,
      status: true,
      productId: true,
      product: {
        select: {
          id: true,
          name: true,
          prices: {
            where: { active: true },
            take: 1,
            select: { id: true, unitAmount: true, currency: true }
          }
        }
      }
    }
  });

  if (!boat) {
    redirect(
      '/account?status=Error&status_description=Listing not found or unauthorized'
    );
  }

  if (boat.status !== 'pending') {
    // Already active (or no longer resumable) — nothing to pay for.
    redirect('/account');
  }

  const price = boat.product?.prices?.[0];

  if (!price) {
    redirect(
      '/account?status=Error&status_description=This listing has no payment plan configured, please contact support'
    );
  }

  const serializedBoat = {
    id: boat.id,
    model: boat.model,
    price: parseFloat(boat.price.toString()),
    currency: boat.currency,
    country: boat.country,
    productName: boat.product?.name || null,
    priceId: price.id,
    amount: Number(price.unitAmount || 0)
  };

  return <ResumePaymentClient boat={serializedBoat} />;
}
