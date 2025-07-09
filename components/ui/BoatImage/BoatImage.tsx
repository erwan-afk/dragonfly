'use client';

interface BoatImageProps {
  src: string;
  alt: string;
  className?: string;
  defaultImage?: string;
  onClick?: () => void;
}

export default function BoatImage({
  src,
  alt,
  className = '',
  defaultImage = '/images/ocean.png',
  onClick
}: BoatImageProps) {
  const handleImageError = (e: any) => {
    e.currentTarget.src = defaultImage;
  };

  return (
    <img
      src={src}
      alt={alt}
      className={`${className} ${onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
      onError={handleImageError}
      onClick={onClick}
    />
  );
}
