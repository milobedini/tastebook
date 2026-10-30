import { fileURLToPath } from 'node:url';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Vercel sets these for previews and production builds. Vite only exposes VITE_* variables to the browser, so the
// three the browser needs are passed in by name; nothing else under SENTRY_ reaches it.
const { SENTRY_AUTH_TOKEN, SENTRY_DSN = '', VERCEL_ENV = '', VERCEL_GIT_COMMIT_SHA = '' } = process.env;

export default defineConfig({
  define: {
    'import.meta.env.VITE_SENTRY_DSN': JSON.stringify(SENTRY_DSN),
    'import.meta.env.VITE_SENTRY_ENVIRONMENT': JSON.stringify(VERCEL_ENV),
    'import.meta.env.VITE_SENTRY_RELEASE': JSON.stringify(VERCEL_GIT_COMMIT_SHA)
  },
  plugins: [
    react(),
    tailwindcss(),
    sentryVitePlugin({
      disable: !SENTRY_AUTH_TOKEN,
      telemetry: false,
      release: { name: VERCEL_GIT_COMMIT_SHA },
      // Uploaded to Sentry, then deleted, so the deployment doesn't serve the source.
      sourcemaps: { filesToDeleteAfterUpload: ['./dist/**/*.map'] }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    sourcemap: SENTRY_AUTH_TOKEN ? 'hidden' : false
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      // The object form keeps the browser's Host header (a bare string sets changeOrigin), so Django's CSRF check
      // sees the page's own origin on a signed-in request.
      '/api': { target: 'http://localhost:8000' },
      '/admin': { target: 'http://localhost:8000' }
    }
  }
});
