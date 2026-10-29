import type { ReactNode } from 'react';

import { cn } from '@/dino/cn';
import type { Lean } from '@/dino/polaroid';

type StickerKind = 'diet' | 'time';
export type StickerItem = { label: string; kind: StickerKind };

const kindStyles: Record<StickerKind, string> = {
  diet: 'bg-pink px-2.5 py-1.5',
  time: 'min-h-16 min-w-16 justify-center bg-butter p-2 text-center'
};

// The transparent border is what forced colours outlines.
export const Sticker = ({ label, kind, lean }: StickerItem & { lean: Lean }) => (
  <span
    className={cn(
      'inline-flex items-center rounded-pill border-2 border-transparent font-extrabold text-on-pastel text-small',
      lean === 'left' ? '-rotate-8' : 'rotate-8',
      'large-text:rotate-0',
      kindStyles[kind]
    )}
  >
    {label}
  </span>
);

type StickeredPhotoProps = { stickers: StickerItem[]; children: ReactNode };

const leanAt = (index: number): Lean => (index % 2 === 0 ? 'left' : 'right');

// Two stickers at most on the photo, the rest below it, and all below it at large text.
// The stickers stay in reading order after the polaroid, so a screen reader reads them after the photo.
export const StickeredPhoto = ({ stickers, children }: StickeredPhotoProps) => {
  const [first, second, ...rest] = stickers;
  return (
    <div className="grid grid-cols-1 gap-3 large-text:flex large-text:flex-wrap large-text:gap-2">
      <div className="col-start-1 row-start-1 large-text:w-full">{children}</div>
      {first && (
        <span className="z-10 col-start-1 row-start-1 -translate-x-2 -translate-y-8 self-end justify-self-start large-text:translate-0">
          <Sticker {...first} lean="left" />
        </span>
      )}
      {second && (
        <span className="z-10 col-start-1 row-start-1 translate-x-2 translate-y-8 self-start justify-self-end large-text:translate-0">
          <Sticker {...second} lean="right" />
        </span>
      )}
      {rest.length > 0 && (
        <div className="row-start-2 flex flex-wrap gap-2 large-text:contents">
          {rest.map((sticker, index) => (
            <Sticker key={sticker.label} {...sticker} lean={leanAt(index)} />
          ))}
        </div>
      )}
    </div>
  );
};
