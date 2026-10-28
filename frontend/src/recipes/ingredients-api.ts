import { useQuery } from '@tanstack/react-query';

import { api } from '../api/client';

export const useIngredients = () =>
  useQuery({
    queryKey: ['ingredients'],
    queryFn: async () => {
      const { data, error } = await api.GET('/api/ingredients/');
      if (error || !data) {
        throw new Error('Ingredients request failed');
      }
      return data;
    }
  });
