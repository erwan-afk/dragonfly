import { notFound } from 'next/navigation';
import { getBoatById } from '@/utils/database/products';
import { dragonflyModels, currencies } from '@/utils/constants';
import type { Boat } from '@/types/boats';
import BoatImageGallery from '@/components/ui/BoatImageGallery/BoatImageGallery';

// Fonction pour valider et normaliser les URLs d'images
function normalizeImageUrls(photos: string[] | null | undefined): string[] {
  if (!photos || !Array.isArray(photos) || photos.length === 0) {
    return [];
  }

  return photos
    .filter((url) => url && typeof url === 'string' && url.trim() !== '')
    .map((url) => {
      const trimmedUrl = url.trim();

      // Si l'URL est déjà complète (commence par http), la retourner telle quelle
      if (
        trimmedUrl.startsWith('http://') ||
        trimmedUrl.startsWith('https://')
      ) {
        return trimmedUrl;
      }

      // Si l'URL commence par '/', c'est une URL relative locale
      if (trimmedUrl.startsWith('/')) {
        return trimmedUrl;
      }

      // Pour les clés R2 relatives, construire l'URL complète
      const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;
      const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
      const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

      if (R2_PUBLIC_URL) {
        return `${R2_PUBLIC_URL}/${trimmedUrl}`;
      } else if (R2_ACCOUNT_ID && R2_BUCKET_NAME) {
        return `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${trimmedUrl}`;
      }

      // Fallback : retourner l'URL telle quelle
      return trimmedUrl;
    });
}

export default async function BoatPage({ params }: { params: { id: string } }) {
  const boat = (await getBoatById(params.id)) as Boat | null;

  if (!boat) {
    notFound();
  }

  const formattedDate = boat.createdAt
    ? new Date(boat.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
      })
    : 'Unknown';

  // Normaliser et valider les URLs d'images R2
  const normalizedPhotos = normalizeImageUrls(boat.photos);

  // Utiliser l'image par défaut si aucune photo valide n'est disponible
  const defaultImage = '/images/ocean.png';
  const allImages =
    normalizedPhotos.length > 0 ? normalizedPhotos : [defaultImage];

  console.log(`🖼️ Boat ${boat.id} images:`, {
    originalPhotos: boat.photos,
    normalizedPhotos: normalizedPhotos,
    finalImages: allImages
  });

  return (
    <section id="Boats" className="w-full pb-[128px] bg-fullwhite">
      <div className="mx-auto max-w-screen-xl flex flex-col gap-[56px]">
        {/* Galerie d'images avec carousel - Compatible R2 */}
        <BoatImageGallery images={allImages} boatModel={boat.model} />

        <div className="flex flex-row justify-between">
          <div className="flex-1 flex flex-col gap-48">
            <div className="px-2.5 py-1.5 w-fit bg-oceanblue rounded-full uppercase text-fullwhite">
              {boat.country}
            </div>

            <div className="gap-32 flex flex-col">
              <h1 className="text-articblue leading-[100%] text-40">
                {dragonflyModels.find((model) => model.key === boat.model)
                  ?.label || boat.model}
              </h1>

              <h2 className="text-oceanblue leading-[100%] text-32 font-medium">
                {boat.price.toString()}{' '}
                {currencies.find((currency) => currency.key === boat.currency)
                  ?.symbol || boat.currency}
              </h2>
              <div className="text-darkgrey text-16">{formattedDate}</div>
            </div>
            <div className="w-full h-[1px] bg-darkgrey/40"></div>
            <p className="text-darkgrey text-20">{boat.description}</p>
            <div className="w-full h-[1px] bg-darkgrey/40"></div>
            <div className="flex flex-col gap-32">
              <h1 className="text-oceanblue text-24">Spécificités</h1>
              <div className="flex flex-row gap-16 flex-wrap">
                {boat.specifications.map((spec: string, index: number) => (
                  <div
                    key={index}
                    className="w-fit px-[8px] py-[5px] bg-lightgrey rounded-[6px] text-oceanblue"
                  >
                    {spec}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="w-[320px] flex flex-col">
            {/* Card du vendeur */}
            <div className="bg-lightgrey rounded-[12px] p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-4">
                {/* Avatar */}
                <div className="w-[46px] h-[46px] rounded-full overflow-hidden bg-white border-2 border-articblue flex items-center justify-center">
                  <div className="w-full h-full  flex items-center justify-center text-articblue text-18 font-medium">
                    {boat.user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  {/* Nom */}
                  <div className="text-articblue text-32 font-medium leading-tight">
                    {boat.user?.name || 'Utilisateur anonyme'}
                  </div>

                  {/* Email */}
                  <div className="text-darkgrey text-14">
                    <span className="font-medium">Mail : </span>
                    <span>{boat.user?.email || 'Non disponible'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
