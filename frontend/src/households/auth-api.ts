import type { components } from '../api/schema';

// allauth's headless endpoints aren't DRF views, so they're outside the OpenAPI schema: the few read here are
// typed by hand from allauth's headless spec.
const ALLAUTH_PATH = '/api/_allauth/browser/v1';
const AUTH_PATH = `${ALLAUTH_PATH}/auth`;

const ACCOUNT_PATH = '/api/account/';

type AuthError = { code: string; param?: string; message: string };
type Flow = { id: string; is_pending?: boolean };

type AuthBody = {
  data?: { user?: { email: string }; flows?: Flow[] };
  errors?: AuthError[];
};

export type Account = components['schemas']['Account'];

// allauth's user carries only the address; the name comes from GET /api/account/.
export type AuthUser = { email: string };

export type CodeFlow = 'login_by_code' | 'verify_email';

export type AuthResult =
  | { kind: 'signed-in'; account: AuthUser }
  | { kind: 'code-sent'; flow: CodeFlow }
  | { kind: 'signed-out' }
  | { kind: 'rejected'; status: 400 | 409; errors: AuthError[] }
  | { kind: 'limited'; retryAfterSeconds: number | undefined };

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

// Whole seconds from the server's Retry-After; undefined when it's missing or isn't a positive whole number.
const retryAfter = (response: Response): number | undefined => {
  const seconds = Number(response.headers.get('Retry-After'));
  return Number.isInteger(seconds) && seconds > 0 ? seconds : undefined;
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

// The account request every page makes sets the CSRF cookie; this covers a press before it has answered.
const ensureCsrfToken = async (): Promise<string | undefined> => {
  if (csrfToken() === undefined) {
    await fetch(`${window.location.origin}${ACCOUNT_PATH}`, { credentials: 'same-origin' });
  }
  return csrfToken();
};

const send = async (method: 'POST' | 'DELETE', path: string, payload?: object): Promise<AuthResult> => {
  const token = await ensureCsrfToken();
  const response = await fetch(`${window.location.origin}${AUTH_PATH}${path}`, {
    method,
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...(token === undefined ? {} : { 'X-CSRFToken': token })
    },
    body: payload === undefined ? undefined : JSON.stringify(payload)
  });
  if (response.status === 429) {
    return { kind: 'limited', retryAfterSeconds: retryAfter(response) };
  }
  return toResult(response.status, await readBody(response));
};

export const requestCode = (email: string) => send('POST', '/code/request', { email });

export const signUp = (email: string) => send('POST', '/signup', { email });

export const confirmSignInCode = (code: string) => send('POST', '/code/confirm', { code });

export const verifyEmail = (code: string) => send('POST', '/email/verify', { key: code });

export const signOut = () => send('DELETE', '/session');

type Provider = { id: string };

type ConfigBody = { data?: { socialaccount?: { providers?: Provider[] } } };

// The ways to sign in besides an email code that this server has set up; none where Google has no client.
export const fetchProviders = async (): Promise<Provider[]> => {
  const response = await fetch(`${window.location.origin}${ALLAUTH_PATH}/config`, { credentials: 'same-origin' });
  if (!response.ok) {
    throw new Error(`Sign-in config request failed with ${response.status}`);
  }
  const body = (await response.json()) as ConfigBody;
  return body.data?.socialaccount?.providers ?? [];
};

// allauth sends the browser on to the provider, so this is a page navigation (a form post), not a fetch. The
// provider sends it back to `callbackUrl`, with `?error=` when signing in didn't work.
export const goToProvider = async (provider: string, callbackUrl: string): Promise<void> => {
  const fields = {
    provider,
    process: 'login',
    callback_url: callbackUrl,
    csrfmiddlewaretoken: (await ensureCsrfToken()) ?? ''
  };
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = `${window.location.origin}${AUTH_PATH}/provider/redirect`;
  form.append(
    ...Object.entries(fields).map(([name, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      input.value = value;
      return input;
    })
  );
  document.body.append(form);
  form.submit();
};
