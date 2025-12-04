import type { Plugin } from 'vite';

/**
 * Плагин для опциональной обработки Sentry
 * Создает виртуальный модуль для @sentry/react, если пакет не установлен
 */
export function sentryOptionalPlugin(): Plugin {
  const virtualModuleId = 'virtual:@sentry/react';
  const resolvedVirtualModuleId = '\0' + virtualModuleId;

  return {
    name: 'sentry-optional',
    enforce: 'pre', // Важно: должен выполняться до других плагинов
    resolveId(id, importer) {
      // Перехватываем импорт @sentry/react
      if (id === '@sentry/react') {
        // Сначала пытаемся найти реальный модуль
        // Если он не найден, используем виртуальный
        return this.resolve(id, importer, { skipSelf: true })
          .then((resolved) => {
            // Если модуль найден, возвращаем его
            if (resolved) {
              return resolved;
            }
            // Иначе возвращаем виртуальный модуль
            return resolvedVirtualModuleId;
          })
          .catch(() => {
            // В случае ошибки используем виртуальный модуль
            return resolvedVirtualModuleId;
          });
      }
      return null;
    },
    load(id) {
      // Возвращаем заглушку для виртуального модуля
      if (id === resolvedVirtualModuleId) {
        return `
          // Виртуальный модуль для @sentry/react (пакет не установлен)
          export default {
            init: () => {},
            captureException: () => {},
            captureMessage: () => {},
            browserTracingIntegration: () => ({}),
            replayIntegration: () => ({}),
          };
          export function init() {}
          export function captureException() {}
          export function captureMessage() {}
          export function browserTracingIntegration() { return {}; }
          export function replayIntegration() { return {}; }
        `;
      }
      return null;
    },
  };
}
