import type { RouteObject } from 'react-router';

import { RecipePage, RecipesPage } from '../recipes';
import { HomePage } from './home-page';
import { NotFoundPage } from './not-found-page';

export const routes: RouteObject[] = [
  { path: '/', Component: HomePage },
  { path: '/recipes', Component: RecipesPage },
  { path: '/recipes/:slug', Component: RecipePage },
  { path: '*', Component: NotFoundPage }
];
