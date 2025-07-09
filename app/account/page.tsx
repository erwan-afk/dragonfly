import { auth } from '@/utils/auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { AccountClient } from '@/components/ui/Account/AccountClient';
import prisma from '@/utils/prisma/client';

// Composant côté serveur pour récupérer les données
export default async function Account() {
  // Récupérer l'utilisateur connecté avec Better Auth
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user) {
    return redirect('/signin');
  }

  const user = session.user;

  try {
    // Utilisons une requête SQL brute pour éviter les problèmes de schéma
    const userDetails = (await prisma.$queryRaw`
      SELECT id, email, name, full_name, avatar_url, billing_address, payment_method, created_at
      FROM "user" 
      WHERE id = ${user.id}
    `) as any[];

    const boats = (await prisma.$queryRaw`
      SELECT * FROM "boats" 
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
    `) as any[];

    if (!userDetails || userDetails.length === 0) {
      return redirect('/signin');
    }

    // Convertir les objets Decimal en nombres pour éviter les problèmes de sérialisation
    const serializedBoats = boats.map((boat) => ({
      ...boat,
      price: parseFloat(boat.price.toString()), // Convertir Decimal en nombre
      createdAt: boat.created_at // Convertir created_at en camelCase
    }));

    return (
      <AccountClient
        userDetails={userDetails[0]}
        boats={serializedBoats || []}
      />
    );
  } catch (error) {
    console.error('Error fetching user data:', error);
    return redirect('/error');
  }
}
