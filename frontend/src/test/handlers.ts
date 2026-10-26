import { HttpResponse, http } from 'msw';

import type { components } from '../api/schema';

type Cuisine = components['schemas']['Cuisine'];
type Health = components['schemas']['Health'];
type Recipe = components['schemas']['Recipe'];

const cuisines: Cuisine[] = [
  { slug: 'french', name: 'French' },
  { slug: 'italian', name: 'Italian' },
  { slug: 'japanese', name: 'Japanese' }
];

const recipes: Recipe[] = [
  {
    id: 1,
    slug: 'apple-tart',
    title: 'Apple tart',
    description: 'Sharp apples on buttery pastry.',
    cuisines: [{ slug: 'french', name: 'French' }]
  },
  { id: 2, slug: 'banana-bread', title: 'Banana bread', description: '', cuisines: [] }
];

export const handlers = [
  http.get('/api/health/', () => HttpResponse.json<Health>({ status: 'ok', database: 'ok', version: '0.1.0' })),
  http.get('/api/cuisines/', () => HttpResponse.json<Cuisine[]>(cuisines)),
  http.get('/api/recipes/', () => HttpResponse.json<Recipe[]>(recipes)),
  http.get('/api/recipes/:slug/', ({ params }) => {
    const recipe = recipes.find(({ slug }) => slug === params.slug);
    return recipe === undefined ? new HttpResponse(null, { status: 404 }) : HttpResponse.json<Recipe>(recipe);
  })
];
