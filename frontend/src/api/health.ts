import { useQuery } from '@tanstack/react-query';

import { api } from './client';

export const useHealth = () =>
  useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const { data, error } = await api.GET('/api/health/');
      if (error || !data) {
        throw new Error('Health check failed');
      }
      return data;
    },
    refetchInterval: 60_000
  });
