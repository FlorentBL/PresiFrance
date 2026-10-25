import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from 'vite-plugin-pwa';
import { GOOGLE_SITE_VERIFICATION } from "./src/lib/site";

function googleSiteVerificationMeta(): Plugin {
  return {
    name: "google-site-verification-meta",
    transformIndexHtml(html) {
      const line = `  <meta name="google-site-verification" content="${GOOGLE_SITE_VERIFICATION}" />\n`;
      if (/<meta\s+name="google-site-verification"[^>]*>/i.test(html)) {
        return html.replace(/<meta\s+name="google-site-verification"[^>]*>\s*\n?/i, line);
      }
      return html.replace("</head>", `${line}</head>`);
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      '/api-explore': {
        target: 'https://explore.data.gouv.fr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-explore/, ''),
      },
      '/api-tabular': {
        target: 'https://tabular-api.data.gouv.fr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-tabular/, ''),
      },
      '/api-geo': {
        target: 'https://geo.api.gouv.fr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-geo/, ''),
      },
      // Fichiers MI (subcom) — évite les blocages CORS en dev sur les gros TXT data.gouv
      '/static-dgf': {
        target: 'https://static.data.gouv.fr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/static-dgf/, ''),
      },
    }
  },
  plugins: [
    react(),
    googleSiteVerificationMeta(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'apple-touch-icon.png', 'logo.webp', 'logo.svg'],
      workbox: {
        globPatterns: ['**/*.{html,css,ico,svg,webmanifest}'],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'script',
            handler: 'CacheFirst',
            options: {
              cacheName: 'js-assets',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
      manifest: {
        name: 'PrésiFrance',
        short_name: 'PrésiFrance',
        description: 'Résultats des élections présidentielles françaises par commune. Open Data.',
        theme_color: '#0f172a',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            if (id.includes("recharts") || id.includes("d3")) return "vendor-charts";
            if (id.includes("leaflet")) return "vendor-maps";
            if (id.includes("lucide-react")) return "vendor-icons";
            if (id.includes("framer-motion")) return "vendor-animation";
            return "vendor";
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
}));
