// Обертка для useTranslation, которая гарантированно попадает в index bundle
// Этот файл импортируется напрямую в main.tsx для гарантии включения в bundle

import { useTranslation as useTranslationOriginal } from './i18n';

// Экспортируем напрямую для использования в компонентах
export function useTranslation() {
  // Проверяем глобальную переменную как fallback
  if (typeof window !== 'undefined' && (window as any).__i18n?.useTranslation) {
    return (window as any).__i18n.useTranslation();
  }
  // Используем оригинальный хук
  return useTranslationOriginal();
}

