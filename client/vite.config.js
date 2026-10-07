import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const CSP = [
  "default-src 'none'",   // tutto vietato, salvo quanto concesso sotto
  "script-src 'self'",    // niente inline, niente eval, niente CDN
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",   // fetch solo verso il proprio dominio: blocca l'esfiltrazione
  "manifest-src 'self'",
  "worker-src 'self'",    // service worker della PWA
  "base-uri 'none'",
  "form-action 'none'",
  "object-src 'none'",
].join('; ');

// Inserisce la CSP come primo elemento di <head>, solo nella build
function cspPlugin() {
  return {
    name: 'erchomai-csp',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace('<head>',
        `<head>\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`);
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: { name: 'Erchomai Transfer', short_name: 'Erchomai', theme_color: '#111111' },
    }),
    cspPlugin(),
  ],
  server: { proxy: { '/api': 'http://localhost:3000' } },
  test: { environment: 'node' },
});