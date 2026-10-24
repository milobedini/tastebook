import createClient from 'openapi-fetch';

import type { paths } from './schema';

export const api = createClient<paths>({
  baseUrl: import.meta.env.VITE_API_URL ?? window.location.origin,
  // Resolve fetch per request so MSW's interception (patched after import) applies in tests.
  fetch: (request) => globalThis.fetch(request)
});
