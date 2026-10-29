import type { ReactNode } from 'react';
import { useState } from 'react';

import { cn } from '@/dino/cn';
import { PhotoFiller } from '@/dino/photo-filler';

type Shape = 'card' | 'hero';

type Thumbnail = { width: number; url: string };

export type Photo = { thumbnails: Thumbnail[] };

type RecipePhotoProps = {
  photo: Photo | null;
  recipeId: number;
  shape: Shape;
  alt: string;
  caption?: ReactNode;
  eager?: boolean;
};

// A card's photo loads as it scrolls into view unless it's eager; a recipe's photo is the first thing on its page, so it loads at once.
// Each size is the page's content less its polaroid's frame: a card is one of 2, 3 or 4 a row, or one at large text.
const shapeImages: Record<Shape, { className: string; sizes: string; loading: 'lazy' | 'eager' }> = {
  card: {
    className: 'aspect-4/3',
    sizes:
      '(width < 17.5em) calc(100vw - 3.5rem), (min-width: 75rem) 10.25rem, (min-width: 64rem) calc(25vw - 8.5rem), ' +
      '(min-width: 40rem) calc(33.3vw - 3.4rem), calc(50vw - 2.75rem)',
    loading: 'lazy'
  },
  // A hero fills the laptop's left column (5 parts of 12) less its 24 px padding, or the one column, at most 42rem.
  hero: {
    className: 'aspect-7/5',
    sizes:
      '(min-width: 75rem) 23.7rem, (min-width: 64rem) calc(41.7vw - 7.6rem), (min-width: 46rem) 40.75rem, ' +
      '(min-width: 40rem) calc(100vw - 5.25rem), calc(100vw - 3.75rem)',
    loading: 'eager'
  }
};

export const RecipePhoto = ({ photo, recipeId, shape, alt, caption, eager = false }: RecipePhotoProps) => {
  // Kept by address, so a recipe whose photo can't load shows its filler without hiding the next recipe's photo.
  const [failedSrc, setFailedSrc] = useState<string>();
  const src = photo?.thumbnails[0]?.url;
  if (photo === null || src === undefined || src === failedSrc) {
    return <PhotoFiller recipeId={recipeId} shape={shape} />;
  }

  const { className, sizes } = shapeImages[shape];
  const loading = eager ? 'eager' : shapeImages[shape].loading;
  const image = (
    <img
      src={src}
      srcSet={photo.thumbnails.map(({ width, url }) => `${url} ${width}w`).join(', ')}
      sizes={sizes}
      alt={alt}
      loading={loading}
      fetchPriority={loading === 'eager' ? 'high' : 'auto'}
      decoding="async"
      // Sent without credentials, so Wikimedia Commons can't set its WMF-Uniq cookie (a third-party cookie Lighthouse fails).
      crossOrigin="anonymous"
      className={cn('w-full object-cover', className)}
      onError={() => setFailedSrc(src)}
    />
  );
  if (caption === undefined) {
    return image;
  }
  return (
    <figure className="flex flex-col">
      {image}
      <figcaption className="break-words pt-2 text-small">{caption}</figcaption>
    </figure>
  );
};
