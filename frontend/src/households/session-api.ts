import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { type Account, getSession, signOut } from './auth-api';

export const SESSION_KEY = ['households', 'session'];

// Null is signed out; undefined while the session is being checked or couldn't be.
export const useSession = () => {
  const { data, isPending, isError } = useQuery({
    queryKey: SESSION_KEY,
    queryFn: async (): Promise<Account | null> => {
      const result = await getSession();
      return result.kind === 'signed-in' ? result.account : null;
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
