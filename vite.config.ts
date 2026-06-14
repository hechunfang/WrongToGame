import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'html-cache-buster',
        transformIndexHtml(html) {
          if (process.env.NODE_ENV !== 'production') {
            return html;
          }
          // Generates date string like 20260614 based on UTC
          const version = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 8);
          let processedHtml = html;
          processedHtml = processedHtml.replace(/(href|src)="(\/assets\/[^"]+)"/g, `$1="$2?v=${version}"`);
          processedHtml = processedHtml.replace(/(href|src)="(\/src\/[^"]+)"/g, `$1="$2?v=${version}"`);
          return processedHtml;
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
