import prisma from '@/utils/prisma/client';
import { unstable_cache } from 'next/cache';

const isDev = process.env.NODE_ENV === 'development';

// Cache des produits (5 minutes)
export const getProductsFromDatabase = unstable_cache(
  async () => {
    try {
      if (isDev) console.log('🔍 Fetching products from database...');

      // Utiliser SQL brut pour éviter les problèmes de schéma Prisma
      const productsRaw = await prisma.$queryRaw`
        SELECT p.*, pr.id as price_id, pr.unit_amount, pr.currency, pr.active as price_active,
               pr.description as price_description, pr.type as price_type, pr.interval,
               pr.interval_count, pr.trial_period_days, pr.metadata as price_metadata
        FROM "products" p
        LEFT JOIN "prices" pr ON p.id = pr.product_id
        WHERE p.active = true AND (pr.active = true OR pr.active IS NULL)
        ORDER BY p.name ASC, pr.unit_amount ASC
      ` as any[];

      // Reformater les données pour correspondre à l'interface attendue
      const products = productsRaw.reduce((acc: any[], row: any) => {
        let product = acc.find(p => p.id === row.id);
        if (!product) {
          product = {
            id: row.id,
            name: row.name,
            description: row.description,
            active: row.active,
            image: row.image,
            metadata: row.metadata,
            prices: []
          };
          acc.push(product);
        }
        if (row.price_id) {
          product.prices.push({
            id: row.price_id,
            product_id: row.id,
            productId: row.id,
            active: row.price_active,
            description: row.price_description,
            unitAmount: Number(row.unit_amount || 0),
            unit_amount: Number(row.unit_amount || 0), // Garder les deux formats pour compatibilité
            currency: row.currency,
            type: row.price_type,
            interval: row.interval,
            intervalCount: row.interval_count,
            interval_count: row.interval_count,
            trialPeriodDays: row.trial_period_days,
            trial_period_days: row.trial_period_days,
            metadata: row.price_metadata
          });
        }
        return acc;
      }, []);

      if (isDev) {
        console.log('✅ Products fetched:', products.length);
      }

      return products;
    } catch (error) {
      console.error('❌ Error fetching products from database:', error);
      throw error;
    }
  },
  ['products-list'],
  {
    revalidate: 300, // Cache pendant 5 minutes
    tags: ['products']
  }
);

// Cache des bateaux (1 minute)
export const getBoatsFromDatabase = unstable_cache(
  async (limit?: number) => {
    try {
      if (isDev) console.log('🔍 Fetching boats from database...');

      let boats: any[];

      // Ne récupérer que les bateaux avec le statut 'active' (payés)
      if (limit) {
        boats = await prisma.$queryRaw`
          SELECT b.id, b.model, b.price, b.country, b.description, b.photos, b.user_id, b.product_id, b.created_at, b.updated_at, b.currency, b.specifications, b.vat_paid, b.status, b.expires_at, b.view_count,
                 u.name as user_name, u.email as user_email, u.avatar_url as user_avatar_url,
                 p.name as product_name
          FROM "boats" b
          LEFT JOIN "user" u ON b.user_id = u.id
          LEFT JOIN "products" p ON b.product_id = p.id
          WHERE b.status IN ('active', 'sold')
          AND (b.expires_at IS NULL OR b.expires_at > NOW())
          ORDER BY
            CASE
              WHEN LOWER(p.name) LIKE '%podium%' THEN 1
              WHEN LOWER(p.name) LIKE '%mid-course%' OR LOWER(p.name) LIKE '%mid course%' THEN 2
              ELSE 3
            END ASC,
            b.created_at DESC
          LIMIT ${limit}
        ` as any[];
      } else {
        boats = await prisma.$queryRaw`
          SELECT b.id, b.model, b.price, b.country, b.description, b.photos, b.user_id, b.product_id, b.created_at, b.updated_at, b.currency, b.specifications, b.vat_paid, b.status, b.expires_at, b.view_count,
                 u.name as user_name, u.email as user_email, u.avatar_url as user_avatar_url,
                 p.name as product_name
          FROM "boats" b
          LEFT JOIN "user" u ON b.user_id = u.id
          LEFT JOIN "products" p ON b.product_id = p.id
          WHERE b.status IN ('active', 'sold')
          AND (b.expires_at IS NULL OR b.expires_at > NOW())
          ORDER BY
            CASE
              WHEN LOWER(p.name) LIKE '%podium%' THEN 1
              WHEN LOWER(p.name) LIKE '%mid-course%' OR LOWER(p.name) LIKE '%mid course%' THEN 2
              ELSE 3
            END ASC,
            b.created_at DESC
        ` as any[];
      }

      // Reformater les données et convertir les objets Decimal en nombres
      const formattedBoats = boats.map((boat: any) => ({
        ...boat,
        price: parseFloat(boat.price.toString()),
        createdAt: boat.created_at,
        viewCount: boat.view_count,
        specifications: boat.specifications,
        productName: boat.product_name || null,
        user: {
          name: boat.user_name,
          email: boat.user_email,
          avatar_url: boat.user_avatar_url
        }
      }));

      if (isDev) {
        console.log('✅ Boats fetched:', formattedBoats.length);
      }

      return formattedBoats;
    } catch (error) {
      console.error('❌ Error fetching boats from database:', error);
      throw error;
    }
  },
  ['boats-list'],
  {
    revalidate: 60, // Cache pendant 1 minute
    tags: ['boats']
  }
);

export async function getBoatById(id: string) {
  try {
    console.log('🔍 Fetching boat by ID:', id);

    const [boat] = await prisma.$queryRaw`
      SELECT b.id, b.model, b.price, b.country, b.description, b.photos, b.user_id, b.product_id, b.created_at, b.updated_at, b.currency, b.specifications, b.vat_paid, b.status, b.expires_at, b.view_count,
             u.name as user_name, u.email as user_email, u.avatar_url as user_avatar_url
      FROM "boats" b
      LEFT JOIN "user" u ON b.user_id = u.id
      -- Sécurité: ne jamais exposer publiquement une annonce "pending" (non payée).
      WHERE b.id = ${id} AND b.status = 'active'
      LIMIT 1
    ` as any[];

    if (!boat) {
      console.log('❌ No boat found with ID:', id);
      return null;
    }

    // Reformater les données et convertir les objets Decimal en nombres
    const formattedBoat = {
      ...boat,
      price: parseFloat(boat.price.toString()), // Convertir Decimal en nombre
      createdAt: boat.created_at, // Convertir created_at en camelCase
      user: {
        name: boat.user_name,
        email: boat.user_email,
        avatar_url: boat.user_avatar_url
      }
    };

    console.log('✅ Boat fetched successfully');
    return formattedBoat;
  } catch (error) {
    console.error('❌ Error fetching boat by ID:', error);
    throw error;
  }
} 