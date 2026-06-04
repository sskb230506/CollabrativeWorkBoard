import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// ─────────────────────────────────────────────────────────────────────────────
// Vite Configuration
//
// Design decisions:
//   - Path aliases (@/*) mirror the backend tsconfig.paths pattern for a
//     consistent developer experience across the monorepo.
//   - `VITE_API_URL` is consumed at runtime; Vite replaces import.meta.env.*
//     at build time so there is no runtime env file needed in production.
//   - The proxy rule only applies in local dev — Vercel handles its own
//     rewrites via vercel.json.
// ─────────────────────────────────────────────────────────────────────────────

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@':          path.resolve(__dirname, './src'),
      '@api':       path.resolve(__dirname, './src/api'),
      '@components':path.resolve(__dirname, './src/components'),
      '@context':   path.resolve(__dirname, './src/context'),
      '@features':  path.resolve(__dirname, './src/features'),
      '@hooks':     path.resolve(__dirname, './src/hooks'),
      '@layouts':   path.resolve(__dirname, './src/layouts'),
      '@pages':     path.resolve(__dirname, './src/pages'),
      '@providers': path.resolve(__dirname, './src/providers'),
      '@routes':    path.resolve(__dirname, './src/routes'),
      '@appTypes':  path.resolve(__dirname, './src/types/index.ts'),
      '@utils':     path.resolve(__dirname, './src/utils'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        // Manual chunks — function form required in Rollup v4
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          if (id.includes('@tanstack/react-query')) return 'vendor-query';
          if (id.includes('react-router-dom'))     return 'vendor-router';
        },
      },
    },
  },
});
