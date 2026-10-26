import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { api } from './client';

export type RecipeFilters = { searchTerm: string; cuisine: string };

const toQuery = ({ searchTerm, cuisine }: RecipeFilters) => ({
  ...(searchTerm === '' ? {} : { q: searchTerm }),
  ...(cuisine === '' ? {} : { cuisine })
});

export const useRecipes = (filters: RecipeFilters) =>
  useQuery({
    queryKey: ['recipes', { q: filters.searchTerm, cuisine: filters.cuisine }],
    queryFn: async () => {
      const { data, error } = await api.GET('/api/recipes/', { params: { query: toQuery(filters) } });
      if (error || !data) {
        throw new Error('Recipes request failed');
      }
      // The filters travel with their results, so previous results shown while loading keep their own empty message.
      return { filters, recipes: data };
    },
    placeholderData: keepPreviousData
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
