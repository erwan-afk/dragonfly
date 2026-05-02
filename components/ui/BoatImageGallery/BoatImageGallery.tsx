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

  // Si aucune image valide, afficher l'image générique (pleine largeur, sans thumbnails)
  if (validImages.length === 0) {
    return (
      <div className="flex w-full gap-8 sm:gap-16 max-h-none sm:max-h-[384px]">
        <div className="w-full h-[250px] sm:h-[384px] rounded-12 overflow-hidden relative">
          <BoatImage
            src="/images/dragonfly-boat.webp"
            alt={`${boatModel} — no photo available`}
            className="w-full h-full object-cover object-center"
          />
        </div>
      </div>
    );
  }

  const mainImage = validImages[0];

  // Images secondaires (max 4)
  const galleryImages = validImages.length > 1 ? validImages.slice(1, 5) : [];
  const total = validImages.length;

  return (
    <>
      <div className="flex flex-col sm:flex-row w-full gap-4 sm:gap-16 sm:max-h-[384px]">
        {/* Image principale — toujours full width sur mobile */}
        <div
          className={`w-full h-[250px] sm:h-[384px] rounded-12 overflow-hidden relative ${
            total === 1
              ? 'sm:w-full'
              : total === 2
                ? 'sm:w-2/3'
                : total === 3
                  ? 'sm:w-3/5'
                  : 'sm:w-1/2'
          }`}
        >
          <BoatImage
            src={mainImage}
            alt={`${boatModel} main view`}
            className="w-full h-full object-cover object-center"
            onClick={() => openCarousel(0)}
          />
        </div>

        {/* Thumbnails — row horizontale scrollable sur mobile, layout desktop inchangé */}
        {galleryImages.length > 0 && (
          <>
            {total === 2 && (
              <div className="w-full sm:w-1/3 h-[160px] sm:h-[384px] rounded-12 overflow-hidden relative">
                <BoatImage
                  src={galleryImages[0]}
                  alt={`${boatModel} view 1`}
                  className="w-full h-full object-cover object-center"
                  onClick={() => openCarousel(1)}
                />
              </div>
            )}

            {total === 3 && (
              <div className="w-full sm:w-2/5 flex flex-row sm:flex-col gap-4 sm:gap-16">
                {galleryImages.slice(0, 2).map((img, index) => (
                  <div
                    key={`right-${index}`}
                    className="h-[120px] sm:h-[184px] w-1/2 sm:w-full rounded-12 overflow-hidden relative"
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
            )}

            {total >= 4 && (
              <div className="w-full sm:w-1/2 grid grid-cols-4 sm:grid-cols-2 gap-4 sm:gap-16">
                {galleryImages.map((img, index) => (
                  <div
                    key={`thumb-${index}`}
                    className="h-[80px] sm:h-[184px] rounded-12 overflow-hidden relative"
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
            )}
          </>
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
