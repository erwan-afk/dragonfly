'use client';

import { useState } from 'react';
import { useDisclosure } from '@heroui/modal';
import BoatImage from '@/components/ui/BoatImage/BoatImage';
import ImageCarousel from '@/components/ui/ImageCarousel/ImageCarousel';

interface BoatImageGalleryProps {
  images: string[];
  boatModel: string;
}

export default function BoatImageGallery({
  images,
  boatModel
}: BoatImageGalleryProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [initialCarouselIndex, setInitialCarouselIndex] = useState(0);

  const openCarousel = (index: number) => {
    setInitialCarouselIndex(index);
    onOpen();
  };

  // Filtrer les images valides (uniquement les vraies images R2)
  const validImages = images.filter(
    (url) =>
      url &&
      url.trim() !== '' &&
      url !== '/images/ocean.png' &&
      url !== '/images/default-boat-image.png'
  );

  // Si aucune image valide, afficher un message
  if (validImages.length === 0) {
    return (
      <div className="flex flex-row w-full gap-16 max-h-[384px]">
        <div className="w-full h-[384px] rounded-12 overflow-hidden relative bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-400 text-lg mb-2">📸</div>
            <p className="text-gray-500 text-sm">Aucune image disponible</p>
            <p className="text-gray-400 text-xs">
              Les images seront affichées après validation
            </p>
          </div>
        </div>
      </div>
    );
  }

  const mainImage = validImages[0];

  // Créer un tableau d'images pour la galerie (4 images maximum pour les petites vues)
  const galleryImages = validImages.length > 1 ? validImages.slice(1, 5) : [];

  return (
    <>
      <div className="flex flex-row w-full gap-16 max-h-[384px]">
        {/* Image principale */}
        <div className="w-full h-[384px] rounded-12 overflow-hidden relative">
          <BoatImage
            src={mainImage}
            alt={`${boatModel} main view`}
            className="w-full h-full object-cover object-center"
            onClick={() => openCarousel(0)}
          />
        </div>

        {/* Conteneur pour les petites images (seulement si il y en a) */}
        {galleryImages.length > 0 && (
          <div className="flex flex-row w-2/3 gap-16">
            {/* Colonne 1 */}
            <div className="flex flex-col gap-16">
              {galleryImages.slice(0, 2).map((img, index) => (
                <div
                  key={`col1-${index}`}
                  className="h-[184px] rounded-12 overflow-hidden relative"
                >
                  <BoatImage
                    src={img}
                    alt={`${boatModel} view ${index + 1}`}
                    className="w-full h-full object-cover object-center"
                    onClick={() => openCarousel(index + 1)}
                  />
                </div>
              ))}
            </div>

            {/* Colonne 2 */}
            <div className="flex flex-col gap-16">
              {galleryImages.slice(2, 4).map((img, index) => (
                <div
                  key={`col2-${index}`}
                  className="h-[184px] rounded-12 overflow-hidden relative"
                >
                  <BoatImage
                    src={img}
                    alt={`${boatModel} view ${index + 3}`}
                    className="w-full h-full object-cover object-center"
                    onClick={() => openCarousel(index + 3)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Carousel popup */}
      <ImageCarousel
        images={validImages}
        isOpen={isOpen}
        onClose={onClose}
        initialIndex={initialCarouselIndex}
        boatModel={boatModel}
      />
    </>
  );
}
