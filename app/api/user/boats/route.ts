import { auth } from '@/utils/auth/auth';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma/client';

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

export async function GET() {
  try {
    // Récupérer l'utilisateur connecté
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Récupérer les bateaux de l'utilisateur
    const boats = await prisma.$queryRaw`
      SELECT id, model, price, country, description, photos, user_id, product_id, created_at, updated_at, currency, specifications, vat_paid, status, expires_at, view_count
      FROM "boats"
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    ` as Promise<any[]>;

    // Convertir les objets Decimal en nombres et normaliser les URLs
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

    return NextResponse.json({ boats: serializedBoats });

  } catch (error) {
    console.error('Error fetching user boats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
