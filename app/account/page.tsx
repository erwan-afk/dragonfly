import { auth } from '@/utils/auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { AccountClient } from '@/components/ui/Account/AccountClient';
import prisma from '@/utils/prisma/client';
import { getProductsFromDatabase } from '@/utils/database/products';

// Forcer le rendu dynamique comme dans forsale pour éviter les problèmes de cache
export const dynamic = 'force-dynamic';

import { normalizeImageUrls } from '@/utils/image-urls';

// Fonction pour récupérer les données utilisateur (sans cache pour éviter les problèmes de synchronisation)
async function getUserData(userId: string) {
  // Paralléliser les requêtes pour gagner du temps
  const [userDetails, boats, payments, favoriteBoats] = await Promise.all([
    prisma.$queryRaw`
      SELECT id, email, name, full_name, avatar_url, billing_address, payment_method, created_at
      FROM "user"
      WHERE id = ${userId}
    ` as Promise<any[]>,
    prisma.$queryRaw`
      SELECT id, model, price, country, description, photos, user_id, product_id, created_at, updated_at, currency, specifications, vat_paid, status, expires_at, view_count, boosted_at, boost_expires_at, has_extra_photos, video_url FROM "boats"
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    ` as Promise<any[]>,
    prisma.$queryRaw`
      SELECT
        p.*,
        b.model as boat_model,
        b.price as boat_price,
        b.currency as boat_currency,
        pr.name as product_name
      FROM "payments" p
      LEFT JOIN "boats" b ON p.boat_id = b.id
      LEFT JOIN "products" pr ON p.product_id = pr.id
      WHERE p.user_id = ${userId} AND (p.status = 'completed' OR p.status = 'succeeded')
      ORDER BY p.created_at DESC
    ` as Promise<any[]>,
    prisma.$queryRaw`
      SELECT b.id, b.model, b.price, b.country, b.description, b.photos, b.user_id, b.product_id, b.created_at, b.updated_at, b.currency, b.specifications, b.vat_paid, b.status, b.expires_at, b.view_count, b.boosted_at, b.boost_expires_at,
             u.name as user_name, u.email as user_email, u.avatar_url as user_avatar_url,
             p.name as product_name
      FROM "favorites" f
      JOIN "boats" b ON f.boat_id = b.id
      LEFT JOIN "user" u ON b.user_id = u.id
      LEFT JOIN "products" p ON b.product_id = p.id
      WHERE f.user_id = ${userId} AND b.status IN ('active', 'sold')
      ORDER BY f.created_at DESC
    ` as Promise<any[]>
  ]);

  return { userDetails, boats, payments, favoriteBoats };
}

// Composant côté serveur pour récupérer les données
export default async function Account() {
  // Récupérer l'utilisateur connecté avec Better Auth
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user) {
    return redirect('/signin/password_signin');
  }

  const user = session.user;

  try {
    // Récupérer les données utilisateur directement (sans cache)
    const { userDetails, boats, payments, favoriteBoats } = await getUserData(user.id);
    const products = await getProductsFromDatabase();

    if (!userDetails || userDetails.length === 0) {
      return redirect('/signin/password_signin');
    }

    // Convertir les objets Decimal en nombres pour éviter les problèmes de sérialisation
    const serializedBoats = boats.map((boat: any) => ({
      ...boat,
      price: parseFloat(boat.price.toString()), // Convertir Decimal en nombre
      createdAt: boat.created_at, // Convertir created_at en camelCase
      expiresAt: boat.expires_at, // Convertir expires_at en camelCase
      productId: boat.product_id, // Convertir product_id en camelCase
      boostedAt: boat.boosted_at,
      boostExpiresAt: boat.boost_expires_at,
      hasExtraPhotos: !!boat.has_extra_photos,
      videoUrl: boat.video_url,
      // Ensure client components always get absolute URLs for images
      photos: normalizeImageUrls(
        typeof boat.photos === 'string' ? JSON.parse(boat.photos) : boat.photos,
        boat.id
      )
    }));

    const serializedFavoriteBoats = favoriteBoats.map((boat: any) => ({
      ...boat,
      price: parseFloat(boat.price.toString()),
      createdAt: boat.created_at,
      expiresAt: boat.expires_at,
      productId: boat.product_id,
      boostedAt: boat.boosted_at,
      boostExpiresAt: boat.boost_expires_at,
      productName: boat.product_name || null,
      photos: normalizeImageUrls(
        typeof boat.photos === 'string' ? JSON.parse(boat.photos) : boat.photos,
        boat.id
      )
    }));

    // Convertir les objets Decimal des paiements
    const serializedPayments = payments.map((payment: any) => ({
      ...payment,
      amount: parseFloat(payment.amount.toString()), // Convertir Decimal en nombre
      createdAt: payment.created_at // Convertir created_at en camelCase
    }));

    // Debug: log des paiements récupérés
    console.log(
      'Payments found for user:',
      user.id,
      payments.length,
      payments.map((p) => ({ id: p.id, status: p.status, amount: p.amount }))
    );

    return (
      <AccountClient
        userDetails={userDetails[0]}
        boats={serializedBoats || []}
        payments={serializedPayments || []}
        favoriteBoats={serializedFavoriteBoats || []}
        products={products}
      />
    );
  } catch (error) {
    console.error('Error fetching user data:', error);
    return redirect('/error');
  }
}
