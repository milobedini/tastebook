# Vite's proxy rewrites the Host header when its target is a string

- **Added:** 2026-10-30 · **Applies to:** spec | implement | review · **Issue:** TAS-102
- **Paths:** `frontend/vite.config.ts`
- **Rule:** A proxy entry written as a bare string (`'/api': 'http://localhost:8000'`) turns on `changeOrigin`, so Django sees `Host: localhost:8000` while the browser sends `Origin: http://localhost:5173`, and Django's CSRF check refuses every unsafe request. The object form without `changeOrigin` (`'/api': { target: 'http://localhost:8000' }`) keeps the browser's Host. Check this before a spec relies on the dev server for a signed-in or CSRF-checked request.
- **Why:** The TAS-102 spec brief said Vite keeps the Host header; the first local run of the API-level sign-in spec on PR #99 answered 403 "Origin checking failed" until the proxy moved to the object form.
- **Re-check by:** 2027-01-30
