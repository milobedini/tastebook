import { HttpResponse, http } from 'msw';

import type { components } from '../api/schema';

type Course = components['schemas']['Course'];
type Cuisine = components['schemas']['Cuisine'];
type Health = components['schemas']['Health'];
type Recipe = components['schemas']['Recipe'];
type RecipeSummary = components['schemas']['RecipeSummary'];

const cuisines: Cuisine[] = [
  { slug: 'french', name: 'French' },
  { slug: 'italian', name: 'Italian' },
  { slug: 'japanese', name: 'Japanese' }
];

const courses: Course[] = [
  { slug: 'dessert', name: 'Dessert' },
  { slug: 'main', name: 'Main' }
];

const recipes: Recipe[] = [
  {
    id: 1,
    slug: 'apple-tart',
    title: 'Apple tart',
    description: 'Sharp apples on buttery pastry.',
    cuisines: [{ slug: 'french', name: 'French' }],
    courses: [{ slug: 'dessert', name: 'Dessert' }],
    difficulty: 'medium',
    prep_minutes: 30,
    cook_minutes: 40,
    extra_minutes: 30,
    extra_label: 'chilling',
    total_minutes: 100,
    photo: null,
    diet_tags: [],
    servings: 8,
    yield_amount: null,
    yield_unit: '',
    equipment: [{ slug: 'oven', name: 'Oven' }],
    one_pot: false,
    source: 'Tastebook',
    ingredient_lines: [],
    ingredient_groups: [],
    steps: [],
    diet_tag_conflicts: []
  },
  {
    id: 2,
    slug: 'banana-bread',
    title: 'Banana bread',
    description: '',
    cuisines: [],
    courses: [],
    difficulty: 'easy',
    prep_minutes: 15,
    cook_minutes: 60,
    extra_minutes: 0,
    extra_label: '',
    total_minutes: 75,
    photo: null,
    diet_tags: [],
    servings: null,
    yield_amount: 1,
    yield_unit: 'loaf',
    equipment: [],
    one_pot: false,
    source: '',
    ingredient_lines: [],
    ingredient_groups: [],
    steps: [],
    diet_tag_conflicts: []
  }
];

const toSummary = ({
  id,
  slug,
  title,
  description,
  cuisines,
  difficulty,
  total_minutes,
  photo,
  diet_tags
}: Recipe): RecipeSummary => ({
  id,
  slug,
  title,
  description,
  cuisines,
  difficulty,
  total_minutes,
  photo,
  diet_tags
});

export const handlers = [
  http.get('/api/health/', () => HttpResponse.json<Health>({ status: 'ok', database: 'ok', version: '0.1.0' })),
  http.get('/api/courses/', () => HttpResponse.json<Course[]>(courses)),
  http.get('/api/cuisines/', () => HttpResponse.json<Cuisine[]>(cuisines)),
  http.get('/api/recipes/', () => HttpResponse.json<RecipeSummary[]>(recipes.map(toSummary))),
  http.get('/api/recipes/:slug/', ({ params }) => {
    const recipe = recipes.find(({ slug }) => slug === params.slug);
    return recipe === undefined ? new HttpResponse(null, { status: 404 }) : HttpResponse.json<Recipe>(recipe);
  })
];
