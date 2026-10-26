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
    // A request's body can hold a recipe's text; cookies and user details are a person's.
    dataCollection: { userInfo: false, cookies: false, httpBodies: [] }
  });
  const reportToSentry = reactErrorHandler();
  // Logged here rather than in reactErrorHandler's callback: passing one marks every error as handled in Sentry, uncaught
  // ones included.
  const reportAndLog: typeof reportToSentry = (error, errorInfo) => {
    reportToSentry(error, errorInfo);
    // biome-ignore lint/suspicious/noConsole: previews' checks read render errors from the console, as React's defaults print them
    console.error(error);
  };
  return { onUncaughtError: reportAndLog, onCaughtError: reportAndLog };
};
