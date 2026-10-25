import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { components } from '../api/schema';
import { renderRoute } from '../test/render-route';
import { server } from '../test/server';

type Health = components['schemas']['Health'];

const failHealth = () => server.use(http.get('/api/health/', () => new HttpResponse(null, { status: 503 })));

// Holds the next health response until released, so the test can see the page while the check is in flight.
const holdHealth = (respond: () => Response) => {
  const gate = { release: () => {} };
  const released = new Promise<void>((resolve) => {
    gate.release = resolve;
  });
  server.use(
    http.get('/api/health/', async () => {
      await released;
      return respond();
    })
  );
  return () => gate.release();
};

// TanStack Query listens for visibilitychange on window, not document.
const setTabVisibility = (state: DocumentVisibilityState) => {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
  window.dispatchEvent(new Event('visibilitychange'));
};

describe('HomePage', () => {
  it('titles the tab "Tastebook"', async () => {
    renderRoute('/');

    await waitFor(() => expect(document.title).toBe('Tastebook'));
  });

  it('shows the API and database status from the health endpoint, with no retry button', async () => {
    renderRoute('/');

    expect(await screen.findByText('API: ok, database: ok')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });

  it('says the API is unreachable and offers a retry when the health check fails', async () => {
    failHealth();

    renderRoute('/');

    expect(await screen.findByRole('alert')).toHaveTextContent('The API is unreachable.');
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('checks the API again and shows its status when the retry succeeds', async () => {
    failHealth();
    renderRoute('/');
    const tryAgain = await screen.findByRole('button', { name: 'Try again' });

    const release = holdHealth(() => HttpResponse.json<Health>({ status: 'ok', database: 'ok' }));
    await userEvent.click(tryAgain);

    expect(await screen.findByText('Checking the API…')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    release();

    expect(await screen.findByText('API: ok, database: ok')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });

  it('brings the message and retry back when the retry fails again', async () => {
    failHealth();
    renderRoute('/');
    const tryAgain = await screen.findByRole('button', { name: 'Try again' });

    const release = holdHealth(() => new HttpResponse(null, { status: 503 }));
    await userEvent.click(tryAgain);

    expect(await screen.findByText('Checking the API…')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();

    release();

    expect(await screen.findByRole('alert')).toHaveTextContent('The API is unreachable.');
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});

describe('HomePage status checks', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date(2026, 9, 25, 15, 42));
  });

  afterEach(() => {
    vi.useRealTimers();
    setTabVisibility('visible');
  });

  it('shows when the status was checked', async () => {
    renderRoute('/');

    expect(await screen.findByText('API: ok, database: ok')).toBeInTheDocument();
    expect(screen.getByText('Last checked at 15:42.')).toBeInTheDocument();
  });

  it('re-checks after a minute and updates the time', async () => {
    renderRoute('/');
    await screen.findByText('API: ok, database: ok');

    server.use(http.get('/api/health/', () => HttpResponse.json<Health>({ status: 'ok', database: 'unavailable' })));
    await vi.advanceTimersByTimeAsync(60_000);

    expect(await screen.findByText('API: ok, database: unavailable')).toBeInTheDocument();
    expect(screen.getByText('Last checked at 15:43.')).toBeInTheDocument();
  });

  it('replaces a good status with the unreachable message when a re-check fails', async () => {
    renderRoute('/');
    await screen.findByText('API: ok, database: ok');

    failHealth();
    await vi.advanceTimersByTimeAsync(59_000);

    expect(screen.getByText('API: ok, database: ok')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    await vi.advanceTimersByTimeAsync(1_000);

    expect(await screen.findByRole('alert')).toHaveTextContent('The API is unreachable.');
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(screen.queryByText('API: ok, database: ok')).not.toBeInTheDocument();
    expect(screen.getByText('Last checked at 15:43.')).toBeInTheDocument();
  });

  it('keeps the message and retry up during an automatic check', async () => {
    failHealth();
    renderRoute('/');
    await screen.findByRole('alert');

    const release = holdHealth(() => HttpResponse.json<Health>({ status: 'ok', database: 'ok' }));
    await vi.advanceTimersByTimeAsync(60_000);

    expect(screen.getByRole('alert')).toHaveTextContent('The API is unreachable.');
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(screen.queryByText('Checking the API…')).not.toBeInTheDocument();

    release();

    expect(await screen.findByText('API: ok, database: ok')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });

  it('pauses while the tab is hidden and checks on return', async () => {
    renderRoute('/');
    await screen.findByText('API: ok, database: ok');

    failHealth();
    setTabVisibility('hidden');
    await vi.advanceTimersByTimeAsync(120_000);

    expect(screen.getByText('API: ok, database: ok')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    setTabVisibility('visible');

    expect(await screen.findByRole('alert')).toHaveTextContent('The API is unreachable.');
  });
});
