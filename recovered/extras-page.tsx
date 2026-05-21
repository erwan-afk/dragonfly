import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/utils/auth/auth';
import prisma from '@/utils/prisma/client';
import ExtrasClient from './ExtrasClient';

export const dynamic = 'force-dynamic';

interface ExtrasPageProps {
  params: { boatId: string };
}

export default async function ExtrasPage({ params }: ExtrasPageProps) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect('/signin/password_signin');
  }

  const boat = (await prisma.boat.findFirst({
    where: { id: params.boatId, userId: session.user.id },
    select: {
      id: true,
      model: true,
      price: true,
      currency: true,
      country: true,
      status: true,
      hasExtraPhotos: true,
      videoUrl: true
    } as any
  })) as any;

  if (!boat) {
    redirect(
      '/account?status=Error&status_description=Boat not found or unauthorized'
    );
  }

  if (boat.status !== 'active') {
    redirect(
      '/account?status=Error&status_description=Only active listings can purchase add-ons'
    );
  }

  if (boat.hasExtraPhotos && boat.videoUrl) {
    redirect(
      '/account?status=Info&status_description=All add-ons are already purchased for this listing'
    );
  }

  // Load add-on prices for display
  const addonProducts = await prisma.product.findMany({
    where: {
      active: true,
      OR: [
        { name: { contains: 'extra photos', mode: 'insensitive' } },
        { name: { contains: 'video', mode: 'insensitive' } }
      ]
    },
    include: {
      prices: {
        where: { active: true },
        orderBy: { unitAmount: 'asc' },
        take: 1
      }
    }
  });

  const photoProduct = addonProducts.find((p) =>
    (p.name || '').toLowerCase().includes('extra')
  );
  const videoProduct = addonProducts.find((p) =>
    (p.name || '').toLowerCase().includes('video')
  );

  const photoPrice = photoProduct?.prices[0]
    ? {
        amount: Number(photoProduct.prices[0].unitAmount || 0),
        currency: photoProduct.prices[0].currency || 'eur'
      }
    : null;

  const videoPrice = videoProduct?.prices[0]
    ? {
        amount: Number(videoProduct.prices[0].unitAmount || 0),
        currency: videoProduct.prices[0].currency || 'eur'
      }
    : null;

  return (
    <ExtrasClient
      boat={{
        id: boat.id,
        model: boat.model,
        price: parseFloat(boat.price.toString()),
        currency: boat.currency,
        country: boat.country,
        hasExtraPhotos: !!boat.hasExtraPhotos,
        videoUrl: boat.videoUrl || null
      }}
      photoPrice={photoPrice}
      videoPrice={videoPrice}
    />
  );
}
