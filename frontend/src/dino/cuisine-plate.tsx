import { cn } from '@/dino/cn';

type Shape = 'card' | 'hero';

type CuisinePlateProps = {
  cuisineSlug: string | undefined;
  shape: Shape;
};

const shapeStyles: Record<Shape, string> = {
  card: 'aspect-4/3',
  hero: 'aspect-16/10'
};

// The plate's drawing takes the cuisine's colour through currentColor.
export const CuisinePlate = ({ cuisineSlug, shape }: CuisinePlateProps) => {
  const colour = `var(--cuisine-${cuisineSlug ?? 'other'}, var(--cuisine-other))`;

  return (
    <div
      aria-hidden="true"
      className={cn('grid place-items-center', shapeStyles[shape])}
      style={{ backgroundColor: colour, color: colour }}
    >
      <svg viewBox="0 0 60 60" aria-hidden="true" className="h-auto w-[62%]">
        <circle cx="30" cy="30" r="27" fill="var(--color-paper)" opacity="0.95" />
        <circle cx="30" cy="30" r="18" fill="none" stroke="currentColor" strokeOpacity="0.35" strokeWidth="2" />
        <circle cx="24" cy="27" r="2" fill="currentColor" opacity="0.7" />
        <circle cx="34" cy="33" r="3" fill="currentColor" opacity="0.7" />
        <circle cx="33" cy="24" r="1.6" fill="currentColor" opacity="0.7" />
      </svg>
    </div>
  );
};
