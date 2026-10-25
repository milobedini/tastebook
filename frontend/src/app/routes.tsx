import type { RouteObject } from 'react-router';

import { HomePage } from '../pages/home-page';
import { NotFoundPage } from '../pages/not-found-page';
import { RecipesPage } from '../pages/recipes-page';

export const routes: RouteObject[] = [
  { path: '/', Component: HomePage },
  { path: '/recipes', Component: RecipesPage },
  { path: '*', Component: NotFoundPage }
];
