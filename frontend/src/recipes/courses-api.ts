import { useQuery } from '@tanstack/react-query';

import { api } from '../api/client';

export const useCourses = () =>
  useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await api.GET('/api/courses/');
      if (error || !data) {
        throw new Error('Courses request failed');
      }
      return data;
    }
  });
