import { close, flush } from '@sentry/react';
import { screen, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { server } from '../test/server';
import { startErrorReporting } from './error-reporting';

const RELEASE = '4ca3bae7c06fdf9c4d95dd193eb4d6f0e2b651ab';

type SentryEvent = {
  environment: string;
  release: string;
  exception: { values: { value: string; mechanism: { handled: boolean } }[] };
};

const DSN = 'https://publickey@o1.ingest.sentry.io/2';

// Envelopes posted to the same-origin tunnel, and any posted straight to the DSN's ingest URL, which blockers drop.
const receiveEnvelopes = () => {
  const received: { tunnelled: string[]; direct: string[] } = { tunnelled: [], direct: [] };
  server.use(
    http.post('/monitoring', async ({ request }) => {
      received.tunnelled.push(await request.text());
      return HttpResponse.json({});
    }),
    http.post('https://o1.ingest.sentry.io/api/2/envelope/', async ({ request }) => {
      received.direct.push(await request.text());
      return HttpResponse.json({});
    })
  );
  return received;
};

// An envelope is a header line, then an item header line and its payload line for each item.
const eventsIn = (envelopes: string[]): SentryEvent[] =>
  envelopes.flatMap((envelope) => {
    const items = envelope.split('\n').slice(1);
    return items.flatMap((line, index) =>
      index % 2 === 0 && JSON.parse(line).type === 'event' ? [JSON.parse(items[index + 1] ?? '') as SentryEvent] : []
    );
  });

const Oven = (): ReactNode => {
  throw new Error('The oven caught fire');
};

const caughtByTheRouter = () => (
  <RouterProvider router={createMemoryRouter([{ path: '/', Component: Oven }], { initialEntries: ['/'] })} />
);
const uncaught = () => <Oven />;

describe('startErrorReporting', () => {
  afterEach(async () => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    await close();
  });

  it.each([
    ['an error the router catches', caughtByTheRouter],
    ['an error nothing catches', uncaught]
  ])(
    'reports %s to Sentry through the tunnel with the environment and release, and logs it to the console',
    async (_, tree) => {
      const received = receiveEnvelopes();
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      vi.stubEnv('VITE_SENTRY_DSN', DSN);
      vi.stubEnv('VITE_SENTRY_ENVIRONMENT', 'production');
      vi.stubEnv('VITE_SENTRY_RELEASE', RELEASE);
      // Rendered as the browser does: under act(), React rethrows uncaught errors instead of passing them to the root.
      vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', false);

      const root = createRoot(document.body.appendChild(document.createElement('div')), startErrorReporting());
      root.render(tree());

      await waitFor(() => expect(eventsIn(received.tunnelled)).toHaveLength(1));
      const [event] = eventsIn(received.tunnelled);
      expect(received.direct).toEqual([]);
      // The tunnel forwards the envelope as it is; Sentry finds the project from the DSN in its header.
      expect(JSON.parse(received.tunnelled[0]?.split('\n')[0] ?? '').dsn).toBe(DSN);
      expect(event?.environment).toBe('production');
      expect(event?.release).toBe(RELEASE);
      expect(event?.exception.values.at(-1)?.value).toBe('The oven caught fire');
      expect(event?.exception.values.at(-1)?.mechanism.handled).toBe(false);
      // React's own default logs the error alone; the router's development logging adds a message before it.
      expect(consoleError.mock.calls).toContainEqual([expect.objectContaining({ message: 'The oven caught fire' })]);
      root.unmount();
    }
  );

  it('sends no request body with the report', async () => {
    const { tunnelled: envelopes } = receiveEnvelopes();
    server.use(http.post('/api/recipes/', () => HttpResponse.json({ id: 3 }, { status: 201 })));
    vi.stubEnv('VITE_SENTRY_DSN', DSN);
    vi.stubEnv('VITE_SENTRY_ENVIRONMENT', 'production');
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', false);

    const root = createRoot(document.body.appendChild(document.createElement('div')), startErrorReporting());
    await fetch('/api/recipes/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Grandma secret tart' })
    });
    root.render(caughtByTheRouter());

    await waitFor(() => expect(eventsIn(envelopes)).toHaveLength(1));
    const [envelope = ''] = envelopes;
    expect(envelope).toContain('The oven caught fire');
    // The request shows in the report's trail; its body must not.
    expect(envelope).toContain('/api/recipes/');
    expect(envelope).not.toContain('Grandma secret tart');
    root.unmount();
  });

  it.each([
    ['set', 'production', 1, DSN],
    ['set', 'preview', 0, DSN],
    ['unset', 'production', 0, '']
  ])('with the DSN %s in %s, sends %i reports', async (_, environment, eventsSent, dsn) => {
    const received = receiveEnvelopes();
    vi.stubEnv('VITE_SENTRY_DSN', dsn);
    vi.stubEnv('VITE_SENTRY_ENVIRONMENT', environment);
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', false);

    const root = createRoot(document.body.appendChild(document.createElement('div')), startErrorReporting());
    root.render(caughtByTheRouter());

    expect(await screen.findByText('The oven caught fire')).toBeInTheDocument();
    await flush(2000);
    expect(eventsIn(received.tunnelled)).toHaveLength(eventsSent);
    expect(received.direct).toEqual([]);
    root.unmount();
  });
});
