import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import federation from "@originjs/vite-plugin-federation";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === "production";
const isReplit = process.env.REPL_ID !== undefined;
const isVercel = process.env.VERCEL === "1";

export default defineConfig({
  plugins: [
    react(),
    // Runtime error overlay только в dev на Replit
    ...(!isProduction && isReplit ? [runtimeErrorOverlay()] : []),
    // Module Federation только если не на Vercel (чтобы избежать проблем при сборке)
    ...(!isVercel ? [
      federation({
        name: 'smartTasbih',
        filename: 'remoteEntry.js',
        exposes: {
          './App': './client/src/App.tsx',
          './components': './client/src/components/index.ts',
        },
        shared: {
          react: {
            singleton: true,
            requiredVersion: '^18.3.1',
          },
          'react-dom': {
            singleton: true,
            requiredVersion: '^18.3.1',
          },
          'react-router-dom': {
            singleton: true,
          },
        },
      })
    ] : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    target: 'esnext',
    minify: isProduction,
    cssCodeSplit: false,
    rollupOptions: {
      external: (id) => {
        // Исключаем @sentry/react из сборки - будем загружать его динамически во время выполнения
        if (id === '@sentry/react' || id.startsWith('@sentry/')) {
          return true;
        }
        return false;
      },
      onwarn(warning, warn) {
        // Игнорируем предупреждения о Sentry
        const codesToIgnore = ['UNRESOLVED_IMPORT', 'UNRESOLVED_ENTRY'];
        if (codesToIgnore.includes(warning.code)) {
          const source = (warning as any).source || (warning as any).id || (warning as any).importer || '';
          if (typeof source === 'string' && source.includes('@sentry')) {
            return; // Игнорируем предупреждения о Sentry
          }
        }
        warn(warning);
      },
      output: {
        manualChunks: (id) => {
          // Code splitting для оптимизации bundle size
          if (id.includes('node_modules')) {
            // Разделяем крупные библиотеки
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('@radix-ui')) {
              return 'vendor-radix';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'vendor-query';
            }
            if (id.includes('recharts')) {
              return 'vendor-charts';
            }
            return 'vendor';
          }
          // Страницы в отдельные чанки для lazy loading
          if (id.includes('/pages/')) {
            const pageName = id.split('/pages/')[1]?.split('.')[0];
            return `page-${pageName}`;
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Предупреждение при размере > 1MB
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
