import type { components } from '../api/schema';

// allauth's headless endpoints aren't DRF views, so they're outside the OpenAPI schema: the few read here are
// typed by hand from allauth's headless spec.
const AUTH_PATH = '/api/_allauth/browser/v1/auth';

const ACCOUNT_PATH = '/api/account/';

type AuthError = { code: string; param?: string; message: string };
type Flow = { id: string; is_pending?: boolean };

type AuthBody = {
  data?: { user?: { email: string }; flows?: Flow[] };
  errors?: AuthError[];
};

export type Account = components['schemas']['Account'];

export type CodeFlow = 'login_by_code' | 'verify_email';

export type AuthResult =
  | { kind: 'signed-in'; account: Account }
  | { kind: 'code-sent'; flow: CodeFlow }
  | { kind: 'signed-out' }
  | { kind: 'rejected'; status: 400 | 409; errors: AuthError[] };

const isCodeFlow = (id: string | undefined): id is CodeFlow => id === 'login_by_code' || id === 'verify_email';

const csrfToken = (): string | undefined =>
  document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith('csrftoken='))
    ?.slice('csrftoken='.length);

const readBody = async (response: Response): Promise<AuthBody> => {
  try {
    return (await response.json()) as AuthBody;
  } catch {
    // A 409 can come with no body worth reading, and a proxy's error page isn't JSON.
    return {};
  }
};

const toResult = (status: number, body: AuthBody): AuthResult => {
  if (status === 200 && body.data?.user) {
    return { kind: 'signed-in', account: { email: body.data.user.email } };
  }
  if (status === 401) {
    const pending = body.data?.flows
      ?.filter((flow) => flow.is_pending === true)
      .map((flow) => flow.id)
      .find(isCodeFlow);
    return pending === undefined ? { kind: 'signed-out' } : { kind: 'code-sent', flow: pending };
  }
  if (status === 400 || status === 409) {
    return { kind: 'rejected', status, errors: body.errors ?? [] };
  }
  throw new Error(`Sign-in request failed with ${status}`);
};

const send = async (method: 'POST' | 'DELETE', path: string, payload?: object): Promise<AuthResult> => {
  // The account request every page makes sets the CSRF cookie; this covers a press before it has answered.
  if (csrfToken() === undefined) {
    await fetch(`${window.location.origin}${ACCOUNT_PATH}`, { credentials: 'same-origin' });
  }
  const token = csrfToken();
  const response = await fetch(`${window.location.origin}${AUTH_PATH}${path}`, {
    method,
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...(token === undefined ? {} : { 'X-CSRFToken': token })
    },
    body: payload === undefined ? undefined : JSON.stringify(payload)
  });
  return toResult(response.status, await readBody(response));
};

export const requestCode = (email: string) => send('POST', '/code/request', { email });

export const signUp = (email: string) => send('POST', '/signup', { email });

export const confirmSignInCode = (code: string) => send('POST', '/code/confirm', { code });

export const verifyEmail = (code: string) => send('POST', '/email/verify', { key: code });

export const signOut = () => send('DELETE', '/session');
