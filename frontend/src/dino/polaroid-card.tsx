import type { ReactNode } from 'react';
import { useId } from 'react';
import { Link } from 'react-router';

import type { Lean } from '@/dino/polaroid';
import { Polaroid } from '@/dino/polaroid';
import type { Photo } from '@/dino/recipe-photo';
import { RecipePhoto } from '@/dino/recipe-photo';

type PolaroidCardProps = {
  title: string;
  to: string;
  recipeId: number;
  photo: Photo | null;
  lean: Lean;
  eager?: boolean;
  children?: ReactNode;
};

// The link holds only the polaroid, so its name is the caption alone (a name set over visible meta fails label in
// name); its ::after stretches over the meta, so the whole card is the target. The ring stands off the card, square,
// so it clears the tilted corners, and never tilts.
export const PolaroidCard = ({ title, to, recipeId, photo, lean, eager, children }: PolaroidCardProps) => {
  const metaId = useId();
  return (
    <div className="group relative flex flex-col gap-3 has-focus-visible:outline-3 has-focus-visible:outline-ink has-focus-visible:outline-offset-8">
      <Link
        to={to}
        aria-describedby={children ? metaId : undefined}
        className="block text-ink no-underline after:absolute after:inset-0 focus-visible:outline-none"
      >
        <Polaroid frame="small" lean={lean}>
          {/* The caption names the link, so the photo adds nothing for a screen reader. */}
          <RecipePhoto shape="card" photo={photo} recipeId={recipeId} alt="" eager={eager} />
          <h2 className="break-words px-0.5 pt-1 pb-2 text-caption">{title}</h2>
        </Polaroid>
      </Link>
      {children && (
        <div id={metaId} className="pl-1 text-muted text-small">
          {children}
        </div>
      )}
    </div>
  );
};
