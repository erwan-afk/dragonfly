import prisma from '@/utils/prisma/client';
import EditListing from '@/components/ui/AccountForms/EditListing';
import { auth } from '@/utils/auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { normalizeImageUrl } from '@/utils/image-urls';

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
    redirect('/signin/password_signin');
  }

  try {
    console.log('🔍 Loading boat for editing:', params.id);

    // Utilisons SQL brut pour éviter les problèmes de schéma
    const boats = (await prisma.$queryRaw`
      SELECT b.id, b.model, b.price, b.country, b.description, b.email, b.condition, b.year, b.photos, b.currency, b.specifications, b.vat_paid, b.status, b.created_at, b.updated_at, b.user_id, b.product_id, b.expires_at, b.view_count, b.has_extra_photos, b.video_url,
             u.id as user_id, u.name as user_name, u.email as user_email
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
      vatPaid: boat.vat_paid, // Map database field to camelCase
      specifications: (() => {
        // Handle specifications that might be stored as JSON string or array
        if (typeof boat.specifications === 'string') {
          try {
            return JSON.parse(boat.specifications);
          } catch (e) {
            return [];
          }
        }
        return Array.isArray(boat.specifications) ? boat.specifications : [];
      })(),
      photos: (() => {
        // Handle photos that might be stored as JSON string or array
        let photosArray: string[];
        if (typeof boat.photos === 'string') {
          try {
            photosArray = JSON.parse(boat.photos);
          } catch (e) {
            // Fallback to splitting by comma if not valid JSON
            photosArray = boat.photos.split(',').filter((url: string) => url.trim());
          }
        } else {
          photosArray = Array.isArray(boat.photos) ? boat.photos : [];
        }

        return photosArray.map(photo => normalizeImageUrl(photo)).filter(url => url !== '');
      })(),
      userId: boat.user_id, // Ajouter userId pour l'upgrade
      hasExtraPhotos: !!boat.has_extra_photos,
      videoUrl: boat.video_url || null,
      year: typeof boat.year === 'number' ? boat.year : null,
      user: {
        id: boat.user_id,
        name: boat.user_name,
        email: boat.user_email
      }
    };

    // Déterminer le plan actuel basé sur les paiements
    const { getCurrentBoatPlan } = await import('@/utils/boats/payments');
    const currentPlan = await getCurrentBoatPlan(params.id);

    // Ajouter le plan au bateau formaté
    formattedBoat.plan = currentPlan;

    // Vérifier que l'utilisateur est propriétaire de l'annonce ou admin
    const userRole = (session.user as any).role;
    const isAdminUser = userRole === 'admin' || userRole === 'superAdmin';
    if (boat.user_id !== session.user.id && !isAdminUser) {
      return <p className="text-red-500">Unauthorized access.</p>;
    }

    return <EditListing boat={formattedBoat as any} />;
  } catch (error) {
    console.error('Error fetching boat:', error);
    return <p className="text-red-500">Error loading listing.</p>;
  }
}
