import type { ReactNode } from 'react';
import { Link } from 'react-router';

import type { Photo } from '@/dino/recipe-photo';
import { RecipePhoto } from '@/dino/recipe-photo';

type RecipeCardProps = {
  title: string;
  to: string;
  cuisineSlug: string | undefined;
  photo?: Photo | null;
  children?: ReactNode;
};

// The link's ::after covers the card, so the whole card is the target and focus rings the card.
export const RecipeCard = ({ title, to, cuisineSlug, photo = null, children }: RecipeCardProps) => (
  <article className="relative grid grid-cols-[5.75rem_minmax(0,1fr)] items-center gap-3 rounded-card border-3 border-cobalt bg-surface p-2.5 has-focus-visible:outline-2 has-focus-visible:outline-cobalt has-focus-visible:outline-offset-2">
    {/* The title names the link, so the photo adds nothing for a screen reader. */}
    <RecipePhoto shape="card" photo={photo} cuisineSlug={cuisineSlug} alt="" />
    <div className="flex min-w-0 flex-col gap-1">
      <h2 className="text-title">
        <Link
          to={to}
          className="flex min-h-11 items-center text-ink no-underline after:absolute after:inset-0 focus-visible:outline-none"
        >
          {title}
        </Link>
      </h2>
      {children && <div className="text-muted text-small">{children}</div>}
    </div>
  </article>
);
