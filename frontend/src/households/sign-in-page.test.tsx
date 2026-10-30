import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import type { components } from '../api/schema';
import { renderRoute } from '../test/render-route';
import { server } from '../test/server';

type CurrentAccount = components['schemas']['CurrentAccount'];
type Recipe = components['schemas']['Recipe'];

const AUTH = '/api/_allauth/browser/v1/auth';

const baguette: Recipe = {
  id: 3,
  slug: 'baguette',
  title: 'Baguette',
  description: '',
  cuisines: [],
  courses: [],
  difficulty: 'hard',
  prep_minutes: 30,
  cook_minutes: 25,
  extra_minutes: 0,
  extra_label: '',
  total_minutes: 55,
  photo: null,
  diet_tags: [],
  servings: null,
  yield_amount: 2,
  yield_unit: 'loaves',
  equipment: [],
  one_pot: false,
  source: '',
  source_url: '',
  ingredient_lines: [],
  ingredient_groups: [],
  steps: [],
  diet_tag_conflicts: []
};

const signedIn = (email: string) =>
  HttpResponse.json({ status: 200, data: { user: { email }, methods: [] }, meta: { is_authenticated: true } });

const pending = (flow: string) =>
  HttpResponse.json(
    { status: 401, data: { flows: [{ id: flow, is_pending: true }] }, meta: { is_authenticated: false } },
    { status: 401 }
  );

const currentAccount = (email?: string, name = 'Sam') =>
  HttpResponse.json<CurrentAccount>({ account: email === undefined ? null : { email, name } });

const rejected = (status: 400 | 409, errors: { code: string; message: string; param?: string }[] = []) =>
  HttpResponse.json({ status, ...(errors.length === 0 ? {} : { errors }) }, { status });

type SentRequest = { path: string; body: unknown };

// A stand-in for allauth: sam@example.com has an account, any other address doesn't, and 123456 is the code.
const answerAllauth = () => {
  const sent: SentRequest[] = [];
  const state: { signedInAs?: string } = {};
  const record = async (path: string, request: Request) => {
    const body: unknown = await request.json();
    sent.push({ path, body });
    return body as Record<string, string>;
  };
  server.use(
    http.get('/api/account/', () => currentAccount(state.signedInAs)),
    http.post(`${AUTH}/code/request`, async ({ request }) => {
      const { email } = await record('code/request', request);
      return email === 'sam@example.com'
        ? pending('login_by_code')
        : rejected(400, [{ code: 'unknown_email', param: 'email', message: 'Unknown email address.' }]);
    }),
    http.post(`${AUTH}/signup`, async ({ request }) => {
      await record('signup', request);
      return pending('verify_email');
    }),
    http.post(`${AUTH}/code/confirm`, async ({ request }) => {
      const { code } = await record('code/confirm', request);
      if (code !== '123456') {
        return rejected(400, [{ code: 'incorrect_code', param: 'code', message: 'Incorrect code.' }]);
      }
      state.signedInAs = 'sam@example.com';
      return signedIn('sam@example.com');
    }),
    http.post(`${AUTH}/email/verify`, async ({ request }) => {
      const { key } = await record('email/verify', request);
      state.signedInAs = 'new@example.com';
      return key === '123456' ? signedIn('new@example.com') : rejected(400);
    }),
    http.get('/api/recipes/baguette/', () => HttpResponse.json<Recipe>(baguette))
  );
  return sent;
};

const emailField = () => screen.getByRole('textbox', { name: 'Email address' });
const codeField = () => screen.getByRole('textbox', { name: 'Code' });

const sendCode = async (email: string) => {
  await userEvent.type(emailField(), email);
  await userEvent.click(screen.getByRole('button', { name: 'Send code' }));
};

const signInWith = async (code: string) => {
  await userEvent.type(await screen.findByRole('textbox', { name: 'Code' }), code);
  await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
};

describe('SignInPage', () => {
  it('signs an existing account in with the emailed code and goes back to the page', async () => {
    const sent = answerAllauth();
    const { router } = renderRoute('/sign-in?next=/recipes/baguette');

    await sendCode('sam@example.com');
    await signInWith('123456');

    expect(await screen.findByRole('heading', { level: 1, name: 'Baguette' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/recipes/baguette');
    expect(sent).toEqual([
      { path: 'code/request', body: { email: 'sam@example.com' } },
      { path: 'code/confirm', body: { code: '123456' } }
    ]);
  });

  it('signs a new address up with the same field and checks it with the emailed code', async () => {
    const sent = answerAllauth();
    renderRoute('/sign-in?next=/recipes/baguette');

    await sendCode('new@example.com');

    const heading = await screen.findByRole('heading', { level: 1, name: 'Check your email' });
    expect(heading).toHaveFocus();
    expect(heading.nextElementSibling).toHaveTextContent(
      'We sent a 6-digit code to new@example.com. It works for 10 minutes.'
    );

    await signInWith('123456');

    expect(await screen.findByRole('heading', { level: 1, name: 'Baguette' })).toBeInTheDocument();
    expect(sent).toEqual([
      { path: 'code/request', body: { email: 'new@example.com' } },
      { path: 'signup', body: { email: 'new@example.com' } },
      { path: 'email/verify', body: { key: '123456' } }
    ]);
  });

  it('says how to fix an address that is not one, and sends nothing', async () => {
    const sent = answerAllauth();
    renderRoute('/sign-in');

    await sendCode('sam@example');

    expect(emailField()).toHaveAccessibleDescription('Enter your email address, like sam@example.com.');
    expect(emailField()).toHaveAttribute('aria-invalid', 'true');
    expect(emailField()).toHaveFocus();
    expect(sent).toEqual([]);
  });

  it("shows the server's message for an address it refuses", async () => {
    answerAllauth();
    const refused = 'Addresses at tastebook.test are only for testing. Use your own email address.';
    server.use(
      http.post(`${AUTH}/signup`, () => rejected(400, [{ code: 'test_account', param: 'email', message: refused }]))
    );
    renderRoute('/sign-in');

    await sendCode('cook@tastebook.test');

    expect(await screen.findByText(refused)).toBeInTheDocument();
    expect(emailField()).toHaveAccessibleDescription(refused);
    expect(emailField()).toHaveValue('cook@tastebook.test');
  });

  it('says how to fix a code that is not 6 digits, and sends nothing', async () => {
    const sent = answerAllauth();
    renderRoute('/sign-in');
    await sendCode('sam@example.com');

    await signInWith('12ab');

    expect(codeField()).toHaveAccessibleDescription('Enter the 6-digit code from the email, like 123456.');
    expect(sent.map(({ path }) => path)).toEqual(['code/request']);
  });

  it.each([
    [
      'a wrong code',
      () => rejected(400, [{ code: 'incorrect_code', param: 'code', message: 'Incorrect code.' }]),
      "That code isn't right. Check the email and try again."
    ],
    [
      'a code that has run out',
      () => rejected(409),
      'That code has run out. Use a different email or send a new code from step 1.'
    ]
  ])('says so for %s and keeps it in the field', async (_, answer, message) => {
    answerAllauth();
    server.use(http.post(`${AUTH}/code/confirm`, answer));
    renderRoute('/sign-in');
    await sendCode('sam@example.com');

    await signInWith('654321');

    await waitFor(() => expect(codeField()).toHaveAccessibleDescription(message));
    expect(codeField()).toHaveValue('654321');
    expect(codeField()).toHaveFocus();
  });

  it("says Tastebook couldn't be reached and keeps the address", async () => {
    answerAllauth();
    server.use(http.post(`${AUTH}/code/request`, () => HttpResponse.error()));
    renderRoute('/sign-in');

    await sendCode('sam@example.com');

    const banner = await screen.findByRole('alert');
    expect(banner).toHaveTextContent("Couldn't reach Tastebook");
    expect(banner).toHaveTextContent('Check your connection and try again.');
    expect(emailField()).toHaveValue('sam@example.com');
  });

  it('goes back to the address, kept and focused, from Use a different email', async () => {
    answerAllauth();
    renderRoute('/sign-in');
    await sendCode('sam@example.com');

    await userEvent.click(await screen.findByRole('button', { name: 'Use a different email' }));

    expect(screen.getByRole('heading', { level: 1, name: 'Sign in' })).toBeInTheDocument();
    expect(emailField()).toHaveValue('sam@example.com');
    expect(emailField()).toHaveFocus();
  });

  it.each([
    ['/recipes/baguette', 'Baguette', '/recipes/baguette'],
    ['//evil.example', 'Tastebook', '/'],
    ['/\\evil.example', 'Tastebook', '/'],
    ['https://evil.example', 'Tastebook', '/'],
    [null, 'Tastebook', '/']
  ])('after signing in with next=%s, lands on %s', async (next, heading, landing) => {
    answerAllauth();
    const { router } = renderRoute(next === null ? '/sign-in' : `/sign-in?next=${encodeURIComponent(next)}`);

    await sendCode('sam@example.com');
    await signInWith('123456');

    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(landing);
  });

  it('sends a new account on to the name page, keeping where it was going', async () => {
    const sent = answerAllauth();
    server.use(
      http.get('/api/account/', () =>
        sent.length > 2 ? currentAccount('new@example.com', '') : currentAccount(undefined)
      )
    );
    const { router } = renderRoute('/sign-in?next=/recipes/baguette');

    await sendCode('new@example.com');
    await signInWith('123456');

    expect(await screen.findByRole('heading', { level: 1, name: "What's your name?" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/welcome');
    expect(router.state.location.search).toBe('?next=%2Frecipes%2Fbaguette');
  });

  it('goes straight to next when already signed in', async () => {
    answerAllauth();
    server.use(http.get('/api/account/', () => currentAccount('sam@example.com')));
    const { router } = renderRoute('/sign-in?next=/recipes');

    expect(await screen.findByRole('heading', { level: 1, name: 'What shall we cook tonight?' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/recipes');
  });
});
