import { useQuery } from '@tanstack/react-query';

import { api } from './client';

export const useRecipes = () =>
  useQuery({
    queryKey: ['recipes'],
    queryFn: async () => {
      const { data, error } = await api.GET('/api/recipes/');
      if (error || !data) {
        throw new Error('Recipes request failed');
      }
      return data;
    }
  });

export const useRecipe = (slug: string) =>
  useQuery({
    queryKey: ['recipes', slug],
    queryFn: async () => {
      const { data, error, response } = await api.GET('/api/recipes/{slug}/', { params: { path: { slug } } });
      // A missing recipe is an answer, not a failure, so it's cached and never retried.
      if (response.status === 404) {
        return null;
      }
      if (error || !data) {
        throw new Error('Recipe request failed');
      }
      return data;
    }
  });
