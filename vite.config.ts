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
    // КРИТИЧНО: Включаем modulePreload для гарантии правильной загрузки vendor chunk
    modulePreload: {
      polyfill: true,
    },
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
    optimizeDeps: {
      include: [
        'react', 
        'react-dom', 
        'react/jsx-runtime', 
        'react/jsx-dev-runtime',
        '@/lib/i18n',
        '@/hooks/use-localization'
      ],
      esbuildOptions: {
        target: 'esnext',
      },
      force: isVercel || isDocker, // Принудительная оптимизация для production,
      force: isVercel, // Принудительная оптимизация для Vercel
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
            // КРИТИЧНО: i18n модули должны быть в main bundle (index.js) для гарантированной загрузки
            // Это предотвращает ошибки "useTranslation is not defined" при lazy loading страниц
            const normalizedId = id.replace(/\\/g, '/');
            // Проверяем различные варианты путей к i18n модулю (более широкие проверки)
            // Логируем для отладки в development
            if (process.env.NODE_ENV === 'development') {
              if (normalizedId.includes('i18n') || normalizedId.includes('use-localization')) {
                console.log('[Vite] i18n module path:', normalizedId);
              }
            }
            if (normalizedId.includes('/lib/i18n') || 
                normalizedId.includes('/hooks/use-localization') ||
                normalizedId.includes('i18n/index') ||
                normalizedId.includes('i18n/translations') ||
                normalizedId.includes('i18n/index.ts') ||
                normalizedId.includes('i18n/index.tsx') ||
                normalizedId.includes('i18n/index.js') ||
                normalizedId.includes('client/src/lib/i18n') ||
                normalizedId.includes('src/lib/i18n') ||
                id.includes('i18n') ||
                normalizedId.includes('use-localization')) {
              return null; // null = включить в main bundle (index.js) для гарантированной загрузки
            }
            // КРИТИЧНО: На Vercel React должен быть в main bundle для гарантированной загрузки
            // Не разделяем React на отдельный chunk, чтобы избежать проблем с порядком загрузки
            if (isVercel) {
              // На Vercel React и react-dom ОБЯЗАТЕЛЬНО в main bundle
              // Проверяем все возможные пути к React (включая вложенные модули)
              const isReact = id.includes('node_modules/react') || 
                             id.includes('node_modules/react-dom') ||
                             id.includes('node_modules/react/jsx-runtime') ||
                             id.includes('node_modules/react/jsx-dev-runtime') ||
                             id.includes('/react/') ||
                             id.includes('/react-dom/');
              
              if (isReact) {
                // React остается в main bundle (null = не разделять)
                return null;
              }
              // Все остальные node_modules в vendor chunk
              if (id.includes('node_modules')) {
                return 'vendor';
              }
              // Страницы в отдельные чанки для lazy loading
              if (id.includes('/pages/')) {
                const pageName = id.split('/pages/')[1]?.split('.')[0];
                return `page-${pageName}`;
              }
              // Остальное в main bundle
              return null;
            }
            // Для Docker - оригинальная логика
            // Но i18n модули всегда в main bundle (проверено выше)
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || 
                id.includes('node_modules/react/index') || id.includes('node_modules/react-dom/index')) {
              return 'vendor';
            }
            // В Docker все vendor библиотеки в одном chunk
            if (id.includes('node_modules')) {
              return 'vendor';
            }
            // КРИТИЧНО: TasbihPage должна быть в main bundle, так как использует i18n
            // Остальные страницы в отдельные чанки для lazy loading
            if (id.includes('/pages/')) {
              const pageName = id.split('/pages/')[1]?.split('.')[0];
              // TasbihPage - главная страница, включаем в main bundle для гарантии загрузки i18n
              if (pageName === 'TasbihPage') {
                return null; // В main bundle
              }
              return `page-${pageName}`;
            }
            // Все остальное (включая i18n, если не попал выше) - в main bundle
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
