import { useMutation, useQueryClient } from '@tanstack/react-query';

import { type AuthResult, type CodeFlow, confirmSignInCode, requestCode, signUp, verifyEmail } from './auth-api';
import { SESSION_KEY } from './session-api';

type Rejected = Extract<AuthResult, { kind: 'rejected' }>;

export type CodeRequest = Extract<AuthResult, { kind: 'code-sent' }> | Rejected;

export type CodeConfirmation = Extract<AuthResult, { kind: 'signed-in' }> | Rejected;

// The page shows only these outcomes; anything else allauth answers is treated like a failed request.
const unexpected = (result: AuthResult): Error => new Error(`Unexpected sign-in answer: ${result.kind}`);

const isUnknownEmail = (result: AuthResult): boolean =>
  result.kind === 'rejected' && result.status === 400 && result.errors[0]?.code === 'unknown_email';

// One email field for both: an address with no account signs up instead, which emails a code to check it.
export const useRequestCode = () =>
  useMutation({
    mutationFn: async (email: string): Promise<CodeRequest> => {
      const requested = await requestCode(email);
      const result = isUnknownEmail(requested) ? await signUp(email) : requested;
      if (result.kind === 'code-sent' || result.kind === 'rejected') {
        return result;
      }
      throw unexpected(result);
    }
  });

export const useConfirmCode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ flow, code }: { flow: CodeFlow; code: string }): Promise<CodeConfirmation> => {
      const result = flow === 'login_by_code' ? await confirmSignInCode(code) : await verifyEmail(code);
      if (result.kind === 'signed-in' || result.kind === 'rejected') {
        return result;
      }
      throw unexpected(result);
    },
    onSuccess: (result) =>
      result.kind === 'signed-in' ? queryClient.invalidateQueries({ queryKey: SESSION_KEY }) : undefined
  });
};
