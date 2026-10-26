import type { RouteObject } from 'react-router';

import { RecipePage, RecipesPage } from '../recipes';
import { HomePage } from './home-page';
import { NotFoundPage } from './not-found-page';

// Lazy, so a production build, where the flag is false, drops the style guide's chunk.
const styleguideRoutes: RouteObject[] = import.meta.env.VITE_SHOW_STYLEGUIDE
  ? [
      {
        path: '/styleguide',
        lazy: async () => ({ Component: (await import('./styleguide/styleguide-page')).StyleguidePage })
      }
    ]
  : [];

export const routes: RouteObject[] = [
  { path: '/', Component: HomePage },
  { path: '/recipes', Component: RecipesPage },
  { path: '/recipes/:slug', Component: RecipePage },
  ...styleguideRoutes,
  { path: '*', Component: NotFoundPage }
];
