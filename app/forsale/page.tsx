import { Suspense } from 'react';
import prisma from '@/utils/prisma/client';
import Pricing from '@/components/ui/Pricing/Pricing';

import oceanImage from '../public/images/ocean.png';
import Link from 'next/link';
import { PricingCard } from '@/components/ui/PrincingCard/PrincingCard';
import SpotlightBoats from '@/components/ui/SpotlightBoats/SpotlightBoats';
import Button from '@/components/ui/Button/Button';
import Scroll from '@/components/icons/Scroll';

export default async function ForSalePage() {
  try {
    console.log('🔍 Loading boats for sale...');

    // Utilisons SQL brut pour éviter les problèmes de schéma
    // Ne récupérer que les bateaux avec le statut 'active' (payés)
    const boats = (await prisma.$queryRaw`
      SELECT b.*, u.name as user_name, u.email as user_email, u.avatar_url as user_avatar_url
      FROM "boats" b
      LEFT JOIN "user" u ON b.user_id = u.id
      WHERE b.status = 'active'
      ORDER BY b.created_at DESC
    `) as any[];

    console.log('✅ Boats loaded successfully for sale');
    console.log('📊 Boats found:', boats.length);

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

    return (
      <div className="w-full flex flex-col">
        <section id="Boats" className="w-full pb-[128px] bg-fullwhite">
          <div className="mx-auto max-w-screen-xl w-full flex flex-col gap-[56px]">
            <div className="flex flex-row items-center justify-between">
              <h1 className="text-articblue text-56">Advertisements</h1>
              <p className="text-darkgrey w-1/2 text-16 font-light">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi
                consectetur quis enim ut volutpat. In massa nulla, blandit sit
                amet semper eget, accumsan eget nisl. In facilisis felis nulla.
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
