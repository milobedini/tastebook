import type { components } from '../api/schema';

type Photo = components['schemas']['RecipePhoto'];

type RecipePhotoCreditProps = { photo: Photo };

export const RecipePhotoCredit = ({ photo }: RecipePhotoCreditProps) => (
  <>
    {`Photo by ${photo.author}, ${photo.licence}, via `}
    <a href={photo.source_url}>Wikimedia Commons</a>
  </>
);
