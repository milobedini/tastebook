import type { RouteObject } from 'react-router';

import { HomePage } from '../pages/home-page';
import { NotFoundPage } from '../pages/not-found-page';

export const routes: RouteObject[] = [
  { path: '/', Component: HomePage },
  { path: '*', Component: NotFoundPage }
];
