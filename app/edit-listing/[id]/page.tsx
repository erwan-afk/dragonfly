import prisma from '@/utils/prisma/client';
import EditListing from '@/components/ui/AccountForms/EditListing';
import { auth } from '@/utils/auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function EditListingPage({
  params
}: {
  params: { id: string };
}) {
  // Vérifier l'authentification
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user) {
    redirect('/signin');
  }

  try {
    console.log('🔍 Loading boat for editing:', params.id);

    // Utilisons SQL brut pour éviter les problèmes de schéma
    const boats = (await prisma.$queryRaw`
      SELECT b.*, u.id as user_id, u.name as user_name, u.email as user_email
      FROM "boats" b
      LEFT JOIN "user" u ON b.user_id = u.id
      WHERE b.id = ${params.id}
    `) as any[];

    if (!boats || boats.length === 0) {
      return <p className="text-red-500">Listing not found.</p>;
    }

    const boat = boats[0];
    console.log('✅ Boat loaded successfully for editing');

    // Reformater les données et convertir les objets Decimal en nombres
    const formattedBoat = {
      ...boat,
      price: parseFloat(boat.price.toString()), // Convertir Decimal en nombre
      user: {
        id: boat.user_id,
        name: boat.user_name,
        email: boat.user_email
      }
    };

    // Vérifier que l'utilisateur est propriétaire de l'annonce
    if (boat.user_id !== session.user.id) {
      return <p className="text-red-500">Unauthorized access.</p>;
    }

    return <EditListing boat={formattedBoat as any} />;
  } catch (error) {
    console.error('Error fetching boat:', error);
    return <p className="text-red-500">Error loading listing.</p>;
  }
}
