'use client';

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Modal, ModalContent, ModalBody, ModalHeader } from '@heroui/modal';
import ArrowButton from '@/components/icons/ArrowButton';
import ArrowSeemore from '@/components/icons/ArrowSeemore';
import { dragonflyModels } from '@/utils/constants';

interface ImageCarouselProps {
  images: string[];
  isOpen: boolean;
  onClose: () => void;
  initialIndex?: number;
  boatModel: string;
}

export default function ImageCarousel({
  images,
  isOpen,
  onClose,
  initialIndex = 0,
  boatModel
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex]);

  const goToNext = () => {
    const nextIndex = (currentIndex + 1) % images.length;
    setCurrentIndex(nextIndex);
  };

  const goToPrevious = () => {
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    setCurrentIndex(prevIndex);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      hideCloseButton={true}
      classNames={{
        base: 'transparent shadow-none border-2 border-lightgrey',

        wrapper: 'items-center justify-center'
      }}
    >
      <ModalContent className="max-w-7xl relative h-[90vh]">
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-row justify-between items-center">
              <div className="text-oceanblue text-lg font-semibold">
                {dragonflyModels.find((model) => model.key === boatModel)
                  ?.label || boatModel}
              </div>
              <button
                onClick={onClose}
                className=" text-gray-600 hover:text-gray-800 transition-colors "
              >
                <X size={20} />
              </button>
            </ModalHeader>

            <ModalBody className="p-4 flex flex-col h-full mx-auto overflow-hidden">
              {/* Conteneur de l'image avec navigation */}
              <div className="flex flex-col items-center justify-center h-full overflow-hidden rounded-[12px]">
                {/* Image principale */}
                <div className="grid grid-cols-[40px_1fr_40px] sm:grid-cols-[56px_1fr_56px] gap-2 sm:gap-3 w-full items-center h-[50vh] sm:h-[70vh]">
                  <button
                    type="button"
                    aria-label="Previous image"
                    onClick={goToPrevious}
                    className="w-[40px] h-[40px] sm:w-[56px] sm:h-[56px] border-2 border-articblue flex items-center justify-center text-articblue hover:border-oceanblue hover:text-oceanblue transition-colors bg-gray-100 rounded-full justify-self-start"
                  >
                    <ArrowSeemore className="rotate-180" size={28} />
                  </button>

                  <div className="w-full h-full overflow-hidden rounded-[12px] flex items-center justify-center">
                    <img
                      src={images[currentIndex]}
                      alt={`Image ${currentIndex + 1}`}
                      className="w-full h-full object-cover rounded-[12px]"
                      onError={(e) => {
                        e.currentTarget.src = '/images/ocean.png';
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    aria-label="Next image"
                    onClick={goToNext}
                    className="w-[40px] h-[40px] sm:w-[56px] sm:h-[56px] border-2 border-articblue flex items-center justify-center text-articblue hover:border-oceanblue hover:text-oceanblue transition-colors bg-gray-100 rounded-full justify-self-end"
                  >
                    <ArrowSeemore size={28} />
                  </button>
                </div>

                {/* Miniatures en dessous */}
                <div className="flex gap-4 justify-center py-4 flex-shrink-0 overflow-x-auto">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      className={`w-[60px] h-[40px] sm:w-[100px] sm:h-[60px] rounded-[12px] overflow-hidden transition-all p-[2px] border-2 flex-shrink-0 relative ${
                        index === currentIndex
                          ? 'border-articblue opacity-100 hover:border-oceanblue'
                          : 'border-gray-300 opacity-60 hover:border-oceanblue'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Miniature ${index + 1}`}
                        className="w-full h-full object-cover rounded-[10px]"
                        onError={(e) => {
                          e.currentTarget.src = '/images/ocean.png';
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
