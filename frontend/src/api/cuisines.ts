import { useQuery } from '@tanstack/react-query';

import { api } from './client';

export const useCuisines = () =>
  useQuery({
    queryKey: ['cuisines'],
    queryFn: async () => {
      const { data, error } = await api.GET('/api/cuisines/');
      if (error || !data) {
        throw new Error('Cuisines request failed');
      }
      return data;
    }
  });
