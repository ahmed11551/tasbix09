import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initTelegramWebApp } from "./lib/telegram";
import { initSentry } from "./lib/sentry";
// КРИТИЧНО: Импортируем i18n в entry point, чтобы модуль был гарантированно включен в main bundle
// Это предотвращает ошибки "useTranslation is not defined" при lazy loading страниц
import "@/lib/i18n";
import * as i18nModule from "@/lib/i18n";
// Импортируем обертку для гарантии включения в bundle
import "@/lib/i18n-hook";
// КРИТИЧНО: Устанавливаем глобальную переменную ДО рендера App
if (typeof window !== 'undefined') {
  (window as any).__i18n = i18nModule;
}

// Инициализация Sentry (если настроен)
if (typeof window !== 'undefined') {
  initSentry();
}

// Инициализация Telegram WebApp
if (typeof window !== 'undefined') {
  try {
    initTelegramWebApp();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Telegram WebApp initialization error:', error);
  }
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

try {
  // Логирование для дебага на Vercel
  if (typeof window !== 'undefined') {
    console.log('[DEBUG] React version:', React.version);
    console.log('[DEBUG] Starting React mount...');
  }
  
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  if (typeof window !== 'undefined') {
    console.log('[DEBUG] React mounted successfully');
  }
} catch (error) {
  // eslint-disable-next-line no-console
  console.error('Failed to render app:', error);
  rootElement.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; text-align: center; font-family: system-ui, -apple-system, sans-serif;">
      <div>
        <h1 style="font-size: 24px; margin-bottom: 16px;">Ошибка загрузки приложения</h1>
        <p style="color: #666; margin-bottom: 24px;">Пожалуйста, обновите страницу или обратитесь в поддержку.</p>
        <button onclick="window.location.reload()" style="padding: 12px 24px; background: #1a5c41; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">
          Обновить страницу
        </button>
        <details style="margin-top: 20px; text-align: left;">
          <summary style="cursor: pointer; color: #666;">Подробности ошибки</summary>
          <pre style="margin-top: 8px; padding: 12px; background: #f5f5f5; border-radius: 4px; overflow: auto; font-size: 12px;">${String(error)}\n\n${error instanceof Error ? error.stack : ''}</pre>
        </details>
      </div>
    </div>
  `;
}

// Добавляем глобальный обработчик ошибок для отлова необработанных ошибок
window.addEventListener('error', (event) => {
  // eslint-disable-next-line no-console
  console.error('Unhandled error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  // eslint-disable-next-line no-console
  console.error('Unhandled promise rejection:', event.reason);
});
