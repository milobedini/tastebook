import type { components } from '../api/schema';

type Cuisine = components['schemas']['Cuisine'];

type RecipeCuisinesProps = { cuisines: Cuisine[] };

export const RecipeCuisines = ({ cuisines }: RecipeCuisinesProps) => {
  if (cuisines.length === 0) {
    return null;
  }
  const label = cuisines.length === 1 ? 'Cuisine' : 'Cuisines';
  return <p>{`${label}: ${cuisines.map(({ name }) => name).join(', ')}`}</p>;
};
