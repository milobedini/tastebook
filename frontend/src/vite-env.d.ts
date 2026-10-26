interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_SHOW_STYLEGUIDE: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
