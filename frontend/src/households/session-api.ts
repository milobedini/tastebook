import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '../api/client';
import { type Account, signOut } from './auth-api';

export const SESSION_KEY = ['households', 'session'];

// Null is signed out; undefined while the session is being checked or couldn't be.
export const useSession = () => {
  const { data, isPending, isError } = useQuery({
    queryKey: SESSION_KEY,
    queryFn: async (): Promise<Account | null> => {
      const { data: current, error } = await api.GET('/api/account/');
      if (error || !current) {
        throw new Error('Session check failed');
      }
      return current.account;
    }
  });
  return { account: data, isPending, isError };
};

export const useSignOut = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: signOut,
    onSuccess: (result) =>
      queryClient.setQueryData<Account | null>(SESSION_KEY, result.kind === 'signed-in' ? result.account : null)
  });
};
