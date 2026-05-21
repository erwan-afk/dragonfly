'use client';

import Image from 'next/image';
import { useState } from 'react';

const FALLBACK = '/images/dragonfly-boat.webp';

interface ModelImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  className?: string;
}

export default function ModelImage({
  src,
  alt,
  fill,
  sizes,
  priority,
  className
}: ModelImageProps) {
  const [imgSrc, setImgSrc] = useState(src);

  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill={fill}
      sizes={sizes}
      priority={priority}
      className={className}
      onError={() => setImgSrc(FALLBACK)}
    />
  );
}
