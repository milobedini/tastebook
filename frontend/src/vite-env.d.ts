interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_SHOW_STYLEGUIDE: boolean;
  readonly VITE_SENTRY_DSN: string;
  readonly VITE_SENTRY_ENVIRONMENT: string;
  readonly VITE_SENTRY_RELEASE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
