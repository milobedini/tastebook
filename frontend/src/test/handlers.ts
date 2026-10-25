import { HttpResponse, http } from 'msw';

import type { components } from '../api/schema';

type Health = components['schemas']['Health'];

export const handlers = [
  http.get('/api/health/', () => HttpResponse.json<Health>({ status: 'ok', database: 'ok', version: '0.1.0' }))
];
