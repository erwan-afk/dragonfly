import prisma from '@/utils/prisma/client';
import SpotlightBoats from '@/components/ui/SpotlightBoats/SpotlightBoats';

interface ForSalePageProps {
  searchParams: Promise<{
    model?: string;
    country?: string;
    minPrice?: string;
    maxPrice?: string;
    attributes?: string;
    sort?: string;
  }>;
}

export async function ForSaleData({ searchParams }: ForSalePageProps) {
  const params = await searchParams;
  const isDev = process.env.NODE_ENV === 'development';

  try {
    if (isDev) {
      console.log('🔍 Loading boats for sale with params:', params);
    }

    // Construire les conditions WHERE dynamiquement
    const conditions: string[] = [
      "b.status IN ('active', 'sold')",
      "(b.expires_at IS NULL OR b.expires_at > NOW())"
    ];
    const sqlParams: any[] = [];
    let paramIndex = 1;

    if (params.model) {
      conditions.push(`b.model = $${paramIndex}`);
      sqlParams.push(params.model);
      paramIndex++;
    }

    if (params.country) {
      conditions.push(`b.country = $${paramIndex}`);
      sqlParams.push(params.country);
      paramIndex++;
    }

    if (params.minPrice) {
      conditions.push(`b.price >= $${paramIndex}`);
      sqlParams.push(parseFloat(params.minPrice));
      paramIndex++;
    }

    if (params.maxPrice) {
      conditions.push(`b.price <= $${paramIndex}`);
      sqlParams.push(parseFloat(params.maxPrice));
      paramIndex++;
    }

    // Filtre par attributs (spécifications)
    if (params.attributes) {
      const attributesList = params.attributes
        .split(',')
        .map((attr: string) => attr.trim());

      // Pour chaque attribut, vérifier qu'il est présent dans le tableau specifications
      attributesList.forEach((attr: string) => {
        conditions.push(`$${paramIndex} = ANY(b.specifications)`);
        sqlParams.push(attr);
        paramIndex++;
      });
    }

    const whereClause = conditions.join(' AND ');

    // Déterminer l'ordre de tri
    let orderBy = 'b.created_at DESC'; // Par défaut
    if (params.sort) {
      switch (params.sort) {
        case 'price_asc':
          orderBy = 'b.price ASC';
          break;
        case 'price_desc':
          orderBy = 'b.price DESC';
          break;
        case 'created_asc':
          orderBy = 'b.created_at ASC';
          break;
        case 'created_desc':
          orderBy = 'b.created_at DESC';
          break;
        case 'model_asc':
          orderBy = 'b.model ASC';
          break;
        case 'model_desc':
          orderBy = 'b.model DESC';
          break;
        default:
          orderBy = 'b.created_at DESC';
      }
    }

    // Utilisons SQL brut pour éviter les problèmes de schéma
    // Ne récupérer que les bateaux avec le statut 'active' (payés)
    const boats = (await prisma.$queryRawUnsafe(
      `
      SELECT b.id, b.model, b.price, b.country, b.description, b.photos, b.user_id, b.product_id, b.created_at, b.updated_at, b.currency, b.specifications, b.vat_paid, b.status, b.expires_at, b.view_count,
             u.name as user_name, u.email as user_email, u.avatar_url as user_avatar_url,
             p.name as product_name
      FROM "boats" b
      LEFT JOIN "user" u ON b.user_id = u.id
      LEFT JOIN "products" p ON b.product_id = p.id
      WHERE ${whereClause}
      ORDER BY
        CASE
          WHEN LOWER(p.name) LIKE '%podium%' THEN 1
          WHEN LOWER(p.name) LIKE '%mid-course%' OR LOWER(p.name) LIKE '%mid course%' THEN 2
          ELSE 3
        END ASC,
        ${orderBy}
    `,
      ...sqlParams
    )) as any[];

    if (isDev) {
      console.log('✅ Boats loaded:', boats.length);
    }

    // Si aucun résultat avec les filtres, récupérer des bateaux suggérés
    let suggestedBoats: any[] = [];
    const hasUrlFilters =
      params.model ||
      params.country ||
      params.minPrice ||
      params.maxPrice ||
      params.attributes;

    if (boats.length === 0 && hasUrlFilters) {
      suggestedBoats = (await prisma.$queryRawUnsafe(
        `
        SELECT b.id, b.model, b.price, b.country, b.description, b.photos, b.user_id, b.product_id, b.created_at, b.updated_at, b.currency, b.specifications, b.vat_paid, b.status, b.expires_at, b.view_count,
               u.name as user_name, u.email as user_email, u.avatar_url as user_avatar_url,
               p.name as product_name
        FROM "boats" b
        LEFT JOIN "user" u ON b.user_id = u.id
        LEFT JOIN "products" p ON b.product_id = p.id
        WHERE b.status = 'active' AND (b.expires_at IS NULL OR b.expires_at > NOW())
        ORDER BY b.created_at DESC
        LIMIT 4
        `
      )) as any[];

      if (isDev) {
        console.log('✅ Suggested boats loaded:', suggestedBoats.length);
      }
    }

    // Reformater les données et convertir les objets Decimal en nombres
    const formatBoat = (boat: any) => ({
      ...boat,
      price: parseFloat(boat.price.toString()),
      createdAt: boat.created_at,
      viewCount: boat.view_count,
      productName: boat.product_name || null,
      user: {
        name: boat.user_name,
        email: boat.user_email,
        avatar_url: boat.user_avatar_url
      }
    });

    const formattedBoats = boats.map(formatBoat);
    const formattedSuggestedBoats = suggestedBoats.map(formatBoat);

    // Générer un message de description basé sur les filtres et le tri
    const hasFilters =
      params.model ||
      params.country ||
      params.minPrice ||
      params.maxPrice ||
      params.attributes ||
      params.sort;

    let filterDescription = '';
    if (hasFilters) {
      const parts: string[] = [];
      parts.push(
        `Showing ${formattedBoats.length} result${formattedBoats.length !== 1 ? 's' : ''}`
      );

      if (params.model) parts.push(`for ${params.model}`);
      if (params.country) parts.push(`in ${params.country}`);
      if (params.minPrice || params.maxPrice) {
        parts.push(
          `with price range €${params.minPrice || '0'} - €${params.maxPrice || '∞'}`
        );
      }
      if (params.attributes) {
        const attrCount = params.attributes.split(',').length;
        parts.push(`with ${attrCount} attribute${attrCount > 1 ? 's' : ''}`);
      }

      // Ajouter l'information de tri
      if (params.sort) {
        let sortDescription = '';
        switch (params.sort) {
          case 'price_asc':
            sortDescription = 'sorted by price (low to high)';
            break;
          case 'price_desc':
            sortDescription = 'sorted by price (high to low)';
            break;
          case 'created_asc':
            sortDescription = 'sorted by date (oldest first)';
            break;
          case 'created_desc':
            sortDescription = 'sorted by date (newest first)';
            break;
          case 'model_asc':
            sortDescription = 'sorted by model (A-Z)';
            break;
          case 'model_desc':
            sortDescription = 'sorted by model (Z-A)';
            break;
        }
        if (sortDescription) {
          parts.push(sortDescription);
        }
      }

      filterDescription = parts.join(' ');
    } else {
      filterDescription =
        'Browse all available Dragonfly boats for sale. Use the filters above to narrow down your search by model, location, and price range.';
    }

    return (
      <div className="w-full flex flex-col">
        <section
          id="Boats"
          className="w-full pb-[64px] lg:pb-[128px] bg-fullwhite px-16 md:px-0"
        >
          <div className="mx-auto max-w-screen-xl w-full flex flex-col gap-[56px]">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-16">
              <h1 className="text-articblue text-32 lg:text-56">
                Advertisements
              </h1>
              <p className="text-darkgrey w-full md:w-1/2 text-14 lg:text-16 font-light">
                Browse all available Dragonfly boats for sale. Use the filters
                below to narrow down your search by model, location, and price
                range.
              </p>
            </div>
            {/* Ajouter w-full ici pour garantir la largeur de SpotlightBoats */}
            <SpotlightBoats
              key="forsale"
              boats={formattedBoats ?? []}
              suggestedBoats={formattedSuggestedBoats}
              searchResultsInfo={hasFilters ? filterDescription : null}
            />
          </div>
        </section>
      </div>
    );
  } catch (error) {
    console.error('Error fetching boats:', error);
    return (
      <div className="w-full flex flex-col">
        <section
          id="Boats"
          className="w-full pb-[64px] lg:pb-[128px] bg-fullwhite"
        >
          <div className="mx-auto max-w-screen-xl w-full flex flex-col gap-[56px]">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-16">
              <h1 className="text-articblue text-32 lg:text-56">
                Advertisements
              </h1>
              <p className="text-darkgrey w-full md:w-1/2 text-14 lg:text-16 font-light">
                Error loading advertisements. Please try again later.
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }
}
