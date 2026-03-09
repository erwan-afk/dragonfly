import { auth } from '@/utils/auth/auth';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma/client';
import { normalizeImageUrls } from '@/utils/image-urls';

export const dynamic = 'force-dynamic';

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
    const boats = (await prisma.$queryRaw`
      SELECT id, model, price, country, description, photos, user_id, product_id, created_at, updated_at, currency, specifications, vat_paid, status, expires_at, view_count
      FROM "boats"
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `) as any[];

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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
