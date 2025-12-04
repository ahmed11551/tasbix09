// Sentry error tracking integration
// Опциональная интеграция - работает только если SENTRY_DSN установлен и @sentry/react установлен

let sentryInitialized = false;

// Функция загрузки Sentry через динамический импорт
// Модуль помечен как external, поэтому загружается только во время выполнения
async function loadSentry() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    // Динамический импорт - модуль будет загружен во время выполнения, если доступен
    const Sentry = await import('@sentry/react');
    return Sentry;
  } catch (error) {
    // Модуль не установлен - возвращаем null
    return null;
  }
}

export function initSentry() {
  if (sentryInitialized || typeof window === 'undefined') {
    return;
  }

  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    return;
  }

  // Загружаем Sentry асинхронно
  loadSentry().then((Sentry) => {
    if (!Sentry || !Sentry.init || typeof Sentry.init !== 'function') {
      return;
    }

    try {
      Sentry.init({
        dsn,
        environment: import.meta.env.MODE || 'production',
        integrations: [
          Sentry.browserTracingIntegration(),
          Sentry.replayIntegration({
            maskAllText: true,
            blockAllMedia: true,
          }),
        ],
        tracesSampleRate: 0.1,
        replaysSessionSampleRate: 0.01,
        replaysOnErrorSampleRate: 1.0,
      });
      sentryInitialized = true;
    } catch {
      // Игнорируем ошибки инициализации
    }
  }).catch(() => {
    // Sentry не установлен - игнорируем
  });
}

export function captureException(error: Error, context?: Record<string, unknown>) {
  if (!sentryInitialized || typeof window === 'undefined') {
    return;
  }

  loadSentry().then((Sentry) => {
    if (Sentry && Sentry.captureException && typeof Sentry.captureException === 'function') {
      Sentry.captureException(error, {
        contexts: {
          custom: context,
        },
      });
    }
  }).catch(() => {
    // Игнорируем
  });
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (!sentryInitialized || typeof window === 'undefined') {
    return;
  }

  loadSentry().then((Sentry) => {
    if (Sentry && Sentry.captureMessage && typeof Sentry.captureMessage === 'function') {
      Sentry.captureMessage(message, level);
    }
  }).catch(() => {
    // Игнорируем
  });
}
