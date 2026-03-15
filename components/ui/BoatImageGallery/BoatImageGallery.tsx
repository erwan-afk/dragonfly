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
      <div className="flex flex-col sm:flex-row w-full gap-8 sm:gap-16 max-h-none sm:max-h-[384px]">
        <div className="w-full h-[250px] sm:h-[384px] rounded-12 overflow-hidden relative bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-400 text-lg mb-2">📸</div>
            <p className="text-gray-500 text-sm">No images available</p>
            <p className="text-gray-400 text-xs">
              Images will be displayed after validation
            </p>
          </div>
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
      <div className="flex flex-col sm:flex-row w-full gap-8 sm:gap-16 max-h-none sm:max-h-[384px]">
        {/* Image principale */}
        <div
          className={`h-[250px] sm:h-[384px] rounded-12 overflow-hidden relative ${
            total === 1
              ? 'w-full'
              : total === 2
                ? 'w-2/3'
                : total === 3
                  ? 'w-3/5'
                  : 'w-1/2'
          }`}
        >
          <BoatImage
            src={mainImage}
            alt={`${boatModel} main view`}
            className="w-full h-full object-cover object-center"
            onClick={() => openCarousel(0)}
          />
        </div>

        {/* Right side thumbnails */}
        {galleryImages.length > 0 && (
          <>
            {total === 2 && (
              <div className="w-full sm:w-1/3 h-[200px] sm:h-[384px] rounded-12 overflow-hidden relative">
                <BoatImage
                  src={galleryImages[0]}
                  alt={`${boatModel} view 1`}
                  className="w-full h-full object-cover object-center"
                  onClick={() => openCarousel(1)}
                />
              </div>
            )}

            {total === 3 && (
              <div className="w-full sm:w-2/5 flex flex-row sm:flex-col gap-8 sm:gap-16">
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
              <div className="w-full sm:w-1/2 flex flex-row gap-8 sm:gap-16">
                {/* Colonne 1 */}
                <div className="flex flex-col gap-8 sm:gap-16 w-1/2">
                  {galleryImages.slice(0, 2).map((img, index) => (
                    <div
                      key={`col1-${index}`}
                      className="h-[100px] sm:h-[184px] rounded-12 overflow-hidden relative"
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
                <div className="flex flex-col gap-8 sm:gap-16 w-1/2">
                  {galleryImages.slice(2, 4).map((img, index) => (
                    <div
                      key={`col2-${index}`}
                      className="h-[100px] sm:h-[184px] rounded-12 overflow-hidden relative"
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
