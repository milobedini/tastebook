import type { RouteObject } from 'react-router';

import { RecipePage, RecipesPage } from '../recipes';
import { AppLayout } from './app-layout';
import { HomePage } from './home-page';
import { NotFoundPage } from './not-found-page';

// The layout route has no path, so every page keeps its address and gets the top bar.
export const routes: RouteObject[] = [
  {
    Component: AppLayout,
    children: [
      { path: '/', Component: HomePage },
      { path: '/recipes', Component: RecipesPage },
      { path: '/recipes/:slug', Component: RecipePage },
      { path: '*', Component: NotFoundPage }
    ]
  }
];
