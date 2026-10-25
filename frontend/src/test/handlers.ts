import { HttpResponse, http } from 'msw';

import type { components } from '../api/schema';

type Health = components['schemas']['Health'];
type Recipe = components['schemas']['Recipe'];

export const handlers = [
  http.get('/api/health/', () => HttpResponse.json<Health>({ status: 'ok', database: 'ok', version: '0.1.0' })),
  http.get('/api/recipes/', () =>
    HttpResponse.json<Recipe[]>([
      { id: 1, title: 'Apple tart', description: 'Sharp apples on buttery pastry.' },
      { id: 2, title: 'Banana bread', description: '' }
    ])
  )
];
