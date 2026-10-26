import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';

import '@fontsource-variable/bricolage-grotesque';
import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import './ui/enamel.css';

import { startErrorReporting } from './app/error-reporting';
import { createQueryClient } from './app/query-client';
import { routes } from './app/routes';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Missing #root element');
}

const rootOptions = startErrorReporting();
const router = createBrowserRouter(routes);
const queryClient = createQueryClient();

createRoot(root, rootOptions).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>
);
