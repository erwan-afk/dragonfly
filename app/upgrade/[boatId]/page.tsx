import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/utils/auth/auth';
import prisma from '@/utils/prisma/client';
import { getProductsFromDatabase } from '@/utils/database/products';
import UpgradeClient from './UpgradeClient';

export const dynamic = 'force-dynamic';

interface UpgradePageProps {
  params: { boatId: string };
  searchParams: { plan?: string };
}

export default async function UpgradePage({
  params,
  searchParams
}: UpgradePageProps) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user) {
    redirect('/signin/password_signin');
  }

  const { boatId } = params;
  const selectedPlanId = searchParams.plan || null;

  // Fetch the boat and verify ownership
  const boat = await prisma.boat.findFirst({
    where: {
      id: boatId,
      userId: session.user.id
    }
  });

  if (!boat) {
    redirect('/account?status=Error&status_description=Boat not found or unauthorized');
  }

  // Get all products
  const products = await getProductsFromDatabase();

  // Sort products by price
  const sortedProducts = [...products].sort((a: any, b: any) => {
    const priceA = a.prices?.[0]?.unit_amount || 0;
    const priceB = b.prices?.[0]?.unit_amount || 0;
    return priceA - priceB;
  });

  // Find current product index and filter upgrade options
  const currentIndex = sortedProducts.findIndex(
    (p: any) => p.id === boat.productId
  );
  const upgradeOptions = sortedProducts.filter(
    (_: any, index: number) => index > currentIndex
  );

  if (upgradeOptions.length === 0) {
    redirect(
      '/account?status=Info&status_description=You already have the highest plan available'
    );
  }

  // Find current product's price info for upgrade difference calculation
  const currentProduct = sortedProducts.find((p: any) => p.id === boat.productId);
  const currentPriceId = currentProduct?.prices?.[0]?.id || null;
  const currentPlanPrice = currentProduct?.prices?.[0]?.unit_amount || 0;

  // Serialize the boat data
  const serializedBoat = {
    id: boat.id,
    model: boat.model,
    price: parseFloat(boat.price.toString()),
    currency: boat.currency,
    country: boat.country,
    productId: boat.productId
  };

  return (
    <UpgradeClient
      boat={serializedBoat}
      products={products as any[]}
      upgradeOptions={upgradeOptions as any[]}
      selectedPlanId={selectedPlanId}
      currentPriceId={currentPriceId}
      currentPlanPrice={currentPlanPrice}
    />
  );
}
