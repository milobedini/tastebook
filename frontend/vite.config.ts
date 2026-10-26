import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Previews and production are both Vercel builds; only VERCEL_ENV tells them apart.
// Anything on Vercel that isn't a preview counts as production, so a missing variable hides the page.
const showStyleguide = process.env.VERCEL !== '1' || process.env.VERCEL_ENV === 'preview';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    'import.meta.env.VITE_SHOW_STYLEGUIDE': JSON.stringify(showStyleguide)
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': 'http://localhost:8000'
    }
  }
});
