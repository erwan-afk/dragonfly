import { auth } from '@/utils/auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { AccountClient } from '@/components/ui/Account/AccountClient';
import prisma from '@/utils/prisma/client';
import { unstable_cache } from 'next/cache';

// Cache la page pendant 30 secondes pour améliorer les performances
export const revalidate = 30;

// Fonction cachée pour récupérer les données utilisateur
const getCachedUserData = unstable_cache(
  async (userId: string) => {
    // Paralléliser les requêtes pour gagner du temps
    const [userDetails, boats] = await Promise.all([
      prisma.$queryRaw`
        SELECT id, email, name, full_name, avatar_url, billing_address, payment_method, created_at
        FROM "user" 
        WHERE id = ${userId}
      ` as Promise<any[]>,
      prisma.$queryRaw`
        SELECT * FROM "boats" 
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
      ` as Promise<any[]>
    ]);

    return { userDetails, boats };
  },
  // IMPORTANT: include userId in the cache key, otherwise different users can share stale data
  ['user-account-data', 'by-user'],
  {
    revalidate: 30,
    // Tag used for invalidation after create/update/delete of a user's boats
    tags: ['user-data']
  }
);

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
    // Utiliser la fonction cachée pour récupérer les données
    const { userDetails, boats } = await getCachedUserData(user.id);

    if (!userDetails || userDetails.length === 0) {
      return redirect('/signin/password_signin');
    }

    // Convertir les objets Decimal en nombres pour éviter les problèmes de sérialisation
    const serializedBoats = boats.map((boat: any) => ({
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
