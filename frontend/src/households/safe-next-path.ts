// The open-redirect guard: only a path on this site, never "//host" or "/\host", which browsers read as another site.
export const safeNextPath = (next: string | null): string =>
  next?.startsWith('/') && next[1] !== '/' && next[1] !== '\\' ? next : '/';

// Django serves these, not the app, so reaching one takes a full page load.
export const isServerPage = (path: string): boolean => path === '/admin' || path.startsWith('/admin/');
