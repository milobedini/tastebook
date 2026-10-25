import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

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
