import { screen, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { renderRoute } from '../test/render-route';
import { server } from '../test/server';

describe('HomePage', () => {
  it('titles the tab "Tastebook"', async () => {
    renderRoute('/');

    await waitFor(() => expect(document.title).toBe('Tastebook'));
  });

  it('shows the API and database status from the health endpoint', async () => {
    renderRoute('/');

    expect(await screen.findByText('API: ok, database: ok')).toBeInTheDocument();
  });

  it('says the API is unreachable when the health check fails', async () => {
    server.use(http.get('/api/health/', () => new HttpResponse(null, { status: 503 })));

    renderRoute('/');

    expect(await screen.findByRole('alert')).toHaveTextContent('The API is unreachable.');
  });
});
