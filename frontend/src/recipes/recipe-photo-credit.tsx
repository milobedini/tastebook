import type { components } from '../api/schema';

type Photo = components['schemas']['RecipePhoto'];

type RecipePhotoCreditProps = { photo: Photo };

export const RecipePhotoCredit = ({ photo }: RecipePhotoCreditProps) => (
  <>
    {`Photo by ${photo.author}, ${photo.licence}, via `}
    {/* On the polaroid's Paper frame, where the base link's Ink text, Field underline and Ink ring would vanish. */}
    <a href={photo.source_url} className="text-on-pastel decoration-on-pastel focus-visible:outline-on-pastel">
      Wikimedia Commons
    </a>
  </>
);
