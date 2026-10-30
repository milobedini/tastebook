import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '../api/client';
import type { components } from '../api/schema';
import type { Account } from './auth-api';
import { SESSION_KEY } from './session-api';

type UnitSystem = components['schemas']['UnitSystem'];

// Saves the account's unit system and puts the answer in the session, so recipe pages open in it at once. Saves
// share a scope, so they reach the server in the order they were chosen and the last choice is the one kept.
export const useChooseUnitSystem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    scope: { id: 'households-unit-system' },
    mutationFn: async (unitSystem: UnitSystem): Promise<Account> => {
      const { data, response } = await api.PATCH('/api/account/', { body: { unit_system: unitSystem } });
      if (data === undefined) {
        throw new Error(`Saving the unit system failed with ${response.status}`);
      }
      return data;
    },
    onSuccess: (account) => queryClient.setQueryData<Account | null>(SESSION_KEY, account)
  });
};
