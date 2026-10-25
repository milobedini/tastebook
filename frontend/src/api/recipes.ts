import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { api } from './client';

export const useRecipes = (searchTerm: string) =>
  useQuery({
    queryKey: ['recipes', { q: searchTerm }],
    queryFn: async () => {
      const { data, error } = await api.GET('/api/recipes/', {
        params: { query: searchTerm === '' ? {} : { q: searchTerm } }
      });
      if (error || !data) {
        throw new Error('Recipes request failed');
      }
      // The term travels with its results, so previous results shown while loading keep their own empty message.
      return { searchTerm, recipes: data };
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
