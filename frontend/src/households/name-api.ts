import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '../api/client';
import type { Account } from './auth-api';
import { SESSION_KEY } from './session-api';

export const NAME_MAX_LENGTH = 50;

export const NOT_A_NAME = 'Enter your name, like Milo.';

export type NameSave = { kind: 'saved'; account: Account } | { kind: 'refused'; message: string };

// DRF answers a refused field as {"name": ["…"]}.
const refusal = (body: unknown): string => {
  const messages = typeof body === 'object' && body !== null && 'name' in body ? body.name : undefined;
  return Array.isArray(messages) && typeof messages[0] === 'string' ? messages[0] : NOT_A_NAME;
};

// Saves the name and puts the answer straight in the session, so the gate lets the person through at once.
export const useSaveName = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string): Promise<NameSave> => {
      const { data, error, response } = await api.PATCH('/api/account/', { body: { name } });
      if (data !== undefined) {
        return { kind: 'saved', account: data };
      }
      if (response.status === 400) {
        return { kind: 'refused', message: refusal(error) };
      }
      throw new Error(`Saving the name failed with ${response.status}`);
    },
    onSuccess: (result) =>
      result.kind === 'saved' ? queryClient.setQueryData<Account | null>(SESSION_KEY, result.account) : undefined
  });
};
