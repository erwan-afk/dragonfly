import { Suspense } from 'react';
import prisma from '@/utils/prisma/client';
import Pricing from '@/components/ui/Pricing/Pricing';

import oceanImage from '../public/images/ocean.png';
import Link from 'next/link';
import { PricingCard } from '@/components/ui/PrincingCard/PrincingCard';
import SpotlightBoats from '@/components/ui/SpotlightBoats/SpotlightBoats';
import Button from '@/components/ui/Button/Button';
import Scroll from '@/components/icons/Scroll';
import { Prisma } from '@prisma/client';

// Désactiver le rendu statique - cette page doit être rendue dynamiquement
export const dynamic = 'force-dynamic';

interface ForSalePageProps {
  searchParams: Promise<{
    model?: string;
    country?: string;
    minPrice?: string;
    maxPrice?: string;
    attributes?: string;
  }>;
}

export default async function ForSalePage({ searchParams }: ForSalePageProps) {
  const isDev = process.env.NODE_ENV === 'development';

  try {
    const params = await searchParams;
    if (isDev) {
      console.log('🔍 Loading boats for sale with params:', params);
    }

    // Construire les conditions WHERE dynamiquement
    const conditions: string[] = ["b.status = 'active'"];
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
        .map((attr) => attr.trim());

      // Pour chaque attribut, vérifier qu'il est présent dans le tableau specifications
      attributesList.forEach((attr) => {
        conditions.push(`$${paramIndex} = ANY(b.specifications)`);
        sqlParams.push(attr);
        paramIndex++;
      });
    }

    const whereClause = conditions.join(' AND ');

    // Utilisons SQL brut pour éviter les problèmes de schéma
    // Ne récupérer que les bateaux avec le statut 'active' (payés)
    const boats = (await prisma.$queryRawUnsafe(
      `
      SELECT b.*, u.name as user_name, u.email as user_email, u.avatar_url as user_avatar_url
      FROM "boats" b
      LEFT JOIN "user" u ON b.user_id = u.id
      WHERE ${whereClause}
      ORDER BY b.created_at DESC
    `,
      ...sqlParams
    )) as any[];

    if (isDev) {
      console.log('✅ Boats loaded:', boats.length);
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

    // Générer un message de description basé sur les filtres
    const hasFilters =
      params.model ||
      params.country ||
      params.minPrice ||
      params.maxPrice ||
      params.attributes;

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

      filterDescription = parts.join(' ');
    } else {
      filterDescription =
        'Browse all available Dragonfly boats for sale. Use the filters above to narrow down your search by model, location, and price range.';
    }

    return (
      <div className="w-full flex flex-col">
        <section id="Boats" className="w-full pb-[128px] bg-fullwhite">
          <div className="mx-auto max-w-screen-xl w-full flex flex-col gap-[56px]">
            <div className="flex flex-row items-center justify-between">
              <h1 className="text-articblue text-56">
                {hasFilters ? 'Search Results' : 'Advertisements'}
              </h1>
              <p className="text-darkgrey w-1/2 text-16 font-light">
                {filterDescription}
              </p>
            </div>
            {/* Ajouter w-full ici pour garantir la largeur de SpotlightBoats */}
            <SpotlightBoats key="forsale" boats={formattedBoats ?? []} />
          </div>
        </section>
      </div>
    );
  } catch (error) {
    console.error('Error fetching boats:', error);
    return (
      <div className="w-full flex flex-col">
        <section id="Boats" className="w-full pb-[128px] bg-fullwhite">
          <div className="mx-auto max-w-screen-xl w-full flex flex-col gap-[56px]">
            <div className="flex flex-row items-center justify-between">
              <h1 className="text-articblue text-56">Advertisements</h1>
              <p className="text-darkgrey w-1/2 text-16 font-light">
                Error loading advertisements. Please try again later.
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }
}
