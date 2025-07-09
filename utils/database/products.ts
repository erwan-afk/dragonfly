import prisma from '@/utils/prisma/client';

export async function getProductsFromDatabase() {
  try {
    console.log('🔍 Fetching products from database...');

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
          active: row.price_active,
          description: row.price_description,
          unit_amount: Number(row.unit_amount || 0),
          currency: row.currency,
          type: row.price_type,
          interval: row.interval,
          interval_count: row.interval_count,
          trial_period_days: row.trial_period_days,
          metadata: row.price_metadata
        });
      }
      return acc;
    }, []);

    console.log('✅ Products fetched from database successfully');
    console.log('📊 Products found:', products.length);

    return products;
  } catch (error) {
    console.error('❌ Error fetching products from database:', error);
    throw error;
  }
}

export async function getBoatsFromDatabase(limit?: number) {
  try {
    console.log('🔍 Fetching boats from database...');

    let boats: any[];
    
    if (limit) {
      boats = await prisma.$queryRaw`
        SELECT b.*, u.name as user_name, u.email as user_email, u.avatar_url as user_avatar_url
        FROM "boats" b
        LEFT JOIN "user" u ON b.user_id = u.id
        ORDER BY b.created_at DESC
        LIMIT ${limit}
      ` as any[];
    } else {
      boats = await prisma.$queryRaw`
        SELECT b.*, u.name as user_name, u.email as user_email, u.avatar_url as user_avatar_url
        FROM "boats" b
        LEFT JOIN "user" u ON b.user_id = u.id
        ORDER BY b.created_at DESC
      ` as any[];
    }

    // Reformater les données et convertir les objets Decimal en nombres
    const formattedBoats = boats.map((boat: any) => ({
      ...boat,
      price: parseFloat(boat.price.toString()), // Convertir Decimal en nombre
      createdAt: boat.created_at, // Convertir created_at en camelCase
      user: {
        name: boat.user_name,
        email: boat.user_email,
        avatar_url: boat.user_avatar_url
      }
    }));

    console.log('✅ Boats fetched from database successfully');
    console.log('📊 Boats found:', formattedBoats.length);

    return formattedBoats;
  } catch (error) {
    console.error('❌ Error fetching boats from database:', error);
    throw error;
  }
}

export async function getBoatById(id: string) {
  try {
    console.log('🔍 Fetching boat by ID:', id);

    const [boat] = await prisma.$queryRaw`
      SELECT b.*, u.name as user_name, u.email as user_email, u.avatar_url as user_avatar_url
      FROM "boats" b
      LEFT JOIN "user" u ON b.user_id = u.id
      WHERE b.id = ${id}
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