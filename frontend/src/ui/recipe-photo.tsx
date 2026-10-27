import type { ReactNode } from 'react';
import { useState } from 'react';

import { cn } from '@/ui/cn';
import { CuisinePlate } from '@/ui/cuisine-plate';

type Shape = 'card' | 'hero';

type Thumbnail = { width: number; url: string };

export type Photo = { thumbnails: Thumbnail[] };

type RecipePhotoProps = {
  photo: Photo | null;
  cuisineSlug: string | undefined;
  shape: Shape;
  alt: string;
  caption?: ReactNode;
};

// A card's photo loads as it scrolls into view; a recipe's photo is the first thing on its page, so it loads at once.
const shapeImages: Record<Shape, { className: string; sizes: string; loading: 'lazy' | 'eager' }> = {
  card: { className: 'aspect-4/3', sizes: '5.75rem', loading: 'lazy' },
  hero: { className: 'aspect-16/10', sizes: '(min-width: 42rem) 40rem, calc(100vw - 2rem)', loading: 'eager' }
};

export const RecipePhoto = ({ photo, cuisineSlug, shape, alt, caption }: RecipePhotoProps) => {
  // Kept by address, so a recipe whose photo can't load shows the plate without hiding the next recipe's photo.
  const [failedSrc, setFailedSrc] = useState<string>();
  const src = photo?.thumbnails[0]?.url;
  if (photo === null || src === undefined || src === failedSrc) {
    return <CuisinePlate shape={shape} cuisineSlug={cuisineSlug} />;
  }

  const { className, sizes, loading } = shapeImages[shape];
  const image = (
    <img
      src={src}
      srcSet={photo.thumbnails.map(({ width, url }) => `${url} ${width}w`).join(', ')}
      sizes={sizes}
      alt={alt}
      loading={loading}
      fetchPriority={loading === 'eager' ? 'high' : 'auto'}
      decoding="async"
      className={cn('w-full rounded-photo object-cover', className)}
      onError={() => setFailedSrc(src)}
    />
  );
  if (caption === undefined) {
    return image;
  }
  return (
    <figure className="flex flex-col gap-2">
      {image}
      <figcaption className="break-words text-muted text-small">{caption}</figcaption>
    </figure>
  );
};
