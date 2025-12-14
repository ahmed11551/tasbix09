// Глобальная обработка ошибок браузерных расширений
// "Could not establish connection" - это ошибка расширений браузера

// Импортируем как можно раньше, до загрузки React
if (typeof window !== 'undefined') {
  // Функция проверки ошибок расширений (работает даже после минификации)
  const isExtensionError = (error: any): boolean => {
    if (!error) return false;
    const errorMessage = error?.message || error?.toString() || String(error) || '';
    const errorStack = error?.stack || '';
    const fullError = `${errorMessage} ${errorStack}`.toLowerCase();
    
    return (
      fullError.includes('could not establish connection') ||
      fullError.includes('receiving end does not exist') ||
      fullError.includes('extension context invalidated') ||
      fullError.includes('message port closed') ||
      fullError.includes('chrome.runtime') ||
      fullError.includes('browser.runtime') ||
      fullError.includes('moz-extension://') ||
      fullError.includes('chrome-extension://') ||
      fullError.includes('safari-extension://')
    );
  };

  // Обработка ошибок Promise (необработанные отклонения)
  window.addEventListener('unhandledrejection', (event) => {
    try {
      if (isExtensionError(event.reason)) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
    } catch (e) {
      // Игнорируем ошибки в обработчике ошибок
    }
  }, true); // useCapture = true для перехвата на ранней стадии

  // Обработка общих ошибок
  window.addEventListener('error', (event) => {
    try {
      if (isExtensionError(event.error) || isExtensionError(event.message)) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        return;
      }
    } catch (e) {
      // Игнорируем ошибки в обработчике ошибок
    }
  }, true); // useCapture = true

  // Подавление ошибок от расширений в консоли
  try {
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    
    console.error = (...args: any[]) => {
      const message = args.map(a => String(a)).join(' ').toLowerCase();
      if (
        message.includes('could not establish connection') ||
        message.includes('receiving end does not exist') ||
        message.includes('extension context invalidated') ||
        message.includes('message port closed')
      ) {
        return; // Не логируем ошибки расширений
      }
      originalConsoleError.apply(console, args);
    };
    
    console.warn = (...args: any[]) => {
      const message = args.map(a => String(a)).join(' ').toLowerCase();
      if (
        message.includes('could not establish connection') ||
        message.includes('receiving end does not exist') ||
        message.includes('extension context invalidated')
      ) {
        return; // Не логируем предупреждения расширений
      }
      originalConsoleWarn.apply(console, args);
    };
  } catch (e) {
    // Если не удалось переопределить console, продолжаем работу
  }
}

