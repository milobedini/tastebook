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
