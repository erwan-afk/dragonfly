import { auth } from '@/utils/auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { AccountClient } from '@/components/ui/Account/AccountClient';
import prisma from '@/utils/prisma/client';
import { getProductsFromDatabase } from '@/utils/database/products';

// Forcer le rendu dynamique comme dans forsale pour éviter les problèmes de cache
export const dynamic = 'force-dynamic';

// Normalise photo entries to absolute URLs when needed (R2 key -> https://.../key).
function normalizeImageUrls(photos: any, boatId?: string): string[] {
  if (!photos || !Array.isArray(photos) || photos.length === 0) return [];

  const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;
  const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
  const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

  return photos
    .filter((url) => url && typeof url === 'string' && url.trim() !== '')
    .map((url) => {
      const trimmedUrl = url.trim();

      // Handle temporary session URLs - these should not be returned as-is
      // They indicate the webhook hasn't processed the payment yet
      if (
        trimmedUrl.includes('temp_session_') &&
        trimmedUrl.startsWith('http')
      ) {
        // Don't return temp URLs - let client retry logic handle conversion
        // Return empty string to indicate image needs to be retried
        console.warn(
          'Found temp session URL in processed boat data:',
          trimmedUrl
        );
        return '';
      }

      if (
        trimmedUrl.startsWith('http://') ||
        trimmedUrl.startsWith('https://')
      ) {
        return trimmedUrl;
      }

      if (trimmedUrl.startsWith('/')) {
        return trimmedUrl;
      }

      if (R2_PUBLIC_URL) {
        // R2_PUBLIC_URL can be stored with or without protocol depending on env usage elsewhere.
        const hasProtocol =
          R2_PUBLIC_URL.startsWith('http://') ||
          R2_PUBLIC_URL.startsWith('https://');
        const base = hasProtocol ? R2_PUBLIC_URL : `https://${R2_PUBLIC_URL}`;
        return `${base}/${trimmedUrl}`;
      }

      if (R2_ACCOUNT_ID && R2_BUCKET_NAME) {
        return `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${trimmedUrl}`;
      }

      return trimmedUrl;
    });
}

// Fonction pour récupérer les données utilisateur (sans cache pour éviter les problèmes de synchronisation)
async function getUserData(userId: string) {
  // Paralléliser les requêtes pour gagner du temps
  const [userDetails, boats, payments] = await Promise.all([
    prisma.$queryRaw`
      SELECT id, email, name, full_name, avatar_url, billing_address, payment_method, created_at
      FROM "user"
      WHERE id = ${userId}
    ` as Promise<any[]>,
    prisma.$queryRaw`
      SELECT id, model, price, country, description, photos, user_id, product_id, created_at, updated_at, currency, specifications, vat_paid, status, expires_at, view_count FROM "boats"
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    ` as Promise<any[]>,
    prisma.$queryRaw`
      SELECT
        p.*,
        b.model as boat_model,
        b.price as boat_price,
        b.currency as boat_currency
      FROM "payments" p
      LEFT JOIN "boats" b ON p.boat_id = b.id
      WHERE p.user_id = ${userId} AND (p.status = 'completed' OR p.status = 'succeeded')
      ORDER BY p.created_at DESC
    ` as Promise<any[]>
  ]);

  return { userDetails, boats, payments };
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
    const { userDetails, boats, payments } = await getUserData(user.id);
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
      // Ensure client components always get absolute URLs for images
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
        products={products}
      />
    );
  } catch (error) {
    console.error('Error fetching user data:', error);
    return redirect('/error');
  }
}
