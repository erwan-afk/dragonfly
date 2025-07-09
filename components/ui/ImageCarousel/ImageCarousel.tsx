'use client';

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Modal, ModalContent, ModalBody, ModalHeader } from '@heroui/modal';
import ArrowButton from '@/components/icons/ArrowButton';
import ArrowSeemore from '@/components/icons/ArrowSeemore';
import { dragonflyModels } from '../BoatListingForm/BoatListingForm';

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
        base: 'transparent shadow-none',
        backdrop: 'bg-white/5 backdrop-blur-md',
        wrapper: 'items-center justify-center'
      }}
    >
      <ModalContent className="max-w-[1416px] relative">
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

            <ModalBody className="p-4 flex flex-col h-full max-h-[90vh] mx-auto overflow-hidden">
              {/* Conteneur de l'image avec navigation */}
              <div className="flex flex-col items-center justify-center h-full overflow-hidden rounded-[12px]">
                <button
                  onClick={goToPrevious}
                  className="absolute w-[60px] ml-[-30px] h-[40px] left-4 z-10 border-2 border-articblue flex items-center justify-center text-articblue hover:border-oceanblue hover:text-oceanblue transition-colors bg-gray-100 rounded-full "
                >
                  <ArrowSeemore className="rotate-180" size={32} />
                </button>
                <button
                  onClick={goToNext}
                  className="absolute w-[60px] mr-[-30px] h-[40px] right-4 z-10 border-2 border-articblue flex items-center justify-center text-articblue hover:border-oceanblue hover:text-oceanblue transition-colors bg-gray-100 rounded-full "
                >
                  <ArrowSeemore size={32} />
                </button>
                {/* Image principale */}
                <div className="flex items-center justify-center flex-1 w-full overflow-hidden rounded-[12px] relative">
                  <img
                    src={images[currentIndex]}
                    alt={`Image ${currentIndex + 1}`}
                    className="w-full  rounded-[12px]"
                    onError={(e) => {
                      e.currentTarget.src = '/images/ocean.png';
                    }}
                  />
                </div>
                {/* Miniatures en dessous */}
                <div className="flex gap-4 justify-center py-4 flex-shrink-0 overflow-x-auto">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      className={`w-[100px] h-[60px] rounded-[12px] overflow-hidden transition-all p-[2px] border-2 flex-shrink-0 relative ${
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
