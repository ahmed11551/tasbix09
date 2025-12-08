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
const isDocker = process.env.DOCKER === "1" || (process.env.NODE_ENV === "production" && !process.env.VERCEL);

export default defineConfig({
  plugins: [
    react(),
    // Runtime error overlay только в dev на Replit
    ...(!isProduction && isReplit ? [runtimeErrorOverlay()] : []),
    // Module Federation только если не на Vercel и не в Docker (чтобы избежать проблем при сборке)
    ...(!isVercel && !isDocker ? [
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
  base: '/',
  define: {
    global: 'globalThis',
    'process.env': {},
  },
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    target: 'es2020',
    minify: isProduction,
    cssCodeSplit: false,
    sourcemap: isVercel ? true : false, // Включаем sourcemap на Vercel для дебага
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react/jsx-runtime'],
      esbuildOptions: {
        target: 'esnext',
      },
    },
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
        // Для Vercel - критично правильный порядок загрузки чанков
        entryFileNames: isVercel ? 'assets/[name].js' : 'assets/[name]-[hash].js',
        chunkFileNames: isVercel ? 'assets/[name].js' : 'assets/[name]-[hash].js',
        assetFileNames: isVercel ? 'assets/[name].[ext]' : 'assets/[name]-[hash].[ext]',
        manualChunks: (id) => {
          // Для Docker и Vercel production - упрощенная конфигурация, чтобы избежать проблем с порядком загрузки
          if (isDocker || isVercel) {
            // КРИТИЧНО: React и react-dom ДОЛЖНЫ быть в vendor chunk для правильной загрузки
            // Используем более точную проверку для Vercel
            if (isVercel) {
              if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || 
                  id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
                return 'vendor';
              }
              // Все остальные node_modules в одном chunk
              if (id.includes('node_modules')) {
                return 'vendor';
              }
              // Страницы в отдельные чанки для lazy loading
              if (id.includes('/pages/')) {
                const pageName = id.split('/pages/')[1]?.split('.')[0];
                return `page-${pageName}`;
              }
              return null;
            }
            // Для Docker - оригинальная логика
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || 
                id.includes('node_modules/react/index') || id.includes('node_modules/react-dom/index')) {
              return 'vendor';
            }
            // В Docker все vendor библиотеки в одном chunk
            if (id.includes('node_modules')) {
              return 'vendor';
            }
            // Страницы в отдельные чанки для lazy loading
            if (id.includes('/pages/')) {
              const pageName = id.split('/pages/')[1]?.split('.')[0];
              return `page-${pageName}`;
            }
            return null;
          }
          
          // Code splitting для оптимизации bundle size (не Docker, не Vercel)
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
