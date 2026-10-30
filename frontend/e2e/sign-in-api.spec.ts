import type { APIRequestContext, APIResponse } from '@playwright/test';
// No page opens here, so ./fixtures' axe check has nothing to scan.
import { expect, test } from '@playwright/test';

import { newTestAccountEmail, readSignInCode } from './test-accounts.ts';

const AUTH = '/api/_allauth/browser/v1/auth';

type AuthError = { code: string };
type AuthBody = { errors?: AuthError[]; data?: { user?: { email: string } } };

const csrfToken = async (request: APIRequestContext): Promise<string> => {
  const { cookies } = await request.storageState();
  return cookies.find(({ name }) => name === 'csrftoken')?.value ?? '';
};

// Django's CSRF check on HTTPS refuses an unsafe request with neither Origin nor Referer.
const unsafeHeaders = async (request: APIRequestContext, baseURL: string): Promise<Record<string, string>> => ({
  'X-CSRFToken': await csrfToken(request),
  Origin: new URL(baseURL).origin
});

const errorCode = async (response: APIResponse): Promise<string | undefined> =>
  ((await response.json()) as AuthBody).errors?.[0]?.code;

const signedInEmail = async (response: APIResponse): Promise<string | undefined> =>
  ((await response.json()) as AuthBody).data?.user?.email;

test('a new test account signs up, signs out and signs in again with emailed codes', async ({ request, baseURL }) => {
  const base = baseURL ?? 'http://localhost:5173';
  const email = newTestAccountEmail();
  await request.get(`${AUTH}/session`);
  const post = async (path: string, data: object): Promise<APIResponse> =>
    request.post(`${AUTH}/${path}`, { data, headers: await unsafeHeaders(request, base) });

  const unknown = await post('code/request', { email });
  expect([unknown.status(), await errorCode(unknown)]).toEqual([400, 'unknown_email']);
  expect((await post('signup', { email })).status()).toBe(401);
  const verified = await post('email/verify', { key: await readSignInCode(request, email) });
  expect([verified.status(), await signedInEmail(verified)]).toEqual([200, email]);
  expect((await request.get(`${AUTH}/session`)).status()).toBe(200);

  const signedOut = await request.delete(`${AUTH}/session`, { headers: await unsafeHeaders(request, base) });
  expect(signedOut.status()).toBe(401);

  expect((await post('code/request', { email })).status()).toBe(401);
  const confirmed = await post('code/confirm', { code: await readSignInCode(request, email) });
  expect([confirmed.status(), await signedInEmail(confirmed)]).toEqual([200, email]);
});
