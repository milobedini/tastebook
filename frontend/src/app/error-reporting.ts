import { init, reactErrorHandler } from '@sentry/react';
import type { RootOptions } from 'react-dom/client';

// Returns the root's error handlers, because an error an error boundary catches (the router's included) never reaches
// the window, where Sentry's own handlers listen.
export const startErrorReporting = (): RootOptions => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  // Vercel sets the DSN for previews and production only: locally, in CI and in tests nothing is sent.
  if (!dsn) {
    return {};
  }
  init({
    dsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT,
    release: import.meta.env.VITE_SENTRY_RELEASE,
    // Ad blockers drop requests to sentry.io; vercel.json forwards this same-origin path to the project's ingest URL.
    tunnel: '/monitoring',
    // A request's body can hold a recipe's text; cookies and user details are a person's.
    dataCollection: { userInfo: false, cookies: false, httpBodies: [] }
  });
  return { onUncaughtError: reactErrorHandler(), onCaughtError: reactErrorHandler() };
};
