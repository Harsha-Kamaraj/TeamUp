import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Tailwind v4 integrates as a Vite plugin (no PostCSS config needed)
  ],
  resolve: {
    alias: {
      // Import from anywhere as "@/..." instead of long relative paths.
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    // Split big third-party libraries into their own long-cached chunks so the
    // entry bundle stays small and under the size-warning threshold.
    // (Vite 8's rolldown bundler wants manualChunks as a function.)
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('react-router')) return 'react-vendor';
          if (id.includes('react-dom')) return 'react-vendor';
          if (id.includes('/react/') || id.includes('react/jsx-runtime') || id.includes('scheduler'))
            return 'react-vendor';
          if (id.includes('@tanstack') || id.includes('axios')) return 'query-vendor';
          if (id.includes('socket.io') || id.includes('engine.io')) return 'socket-vendor';
          if (id.includes('react-hook-form')) return 'form-vendor';
          if (id.includes('lucide-react')) return 'icons';
          return 'vendor';
        },
      },
    },
  },
});
