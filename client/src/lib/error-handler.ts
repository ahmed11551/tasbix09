// Глобальная обработка ошибок браузерных расширений
// "Could not establish connection" - это ошибка расширений браузера

// Импортируем как можно раньше, до загрузки React
if (typeof window !== 'undefined') {
  // Обработка ошибок Promise (необработанные отклонения)
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    const errorMessage = error?.message || String(error);
    
    // Игнорируем ошибки расширений браузера
    if (
      errorMessage.includes('Could not establish connection') ||
      errorMessage.includes('Receiving end does not exist') ||
      errorMessage.includes('Extension context invalidated') ||
      errorMessage.includes('message port closed') ||
      errorMessage.includes('chrome.runtime') ||
      errorMessage.includes('browser.runtime')
    ) {
      // Тихо игнорируем эти ошибки - они не критичны для работы приложения
      event.preventDefault();
      return;
    }
    
    // Для остальных ошибок - логируем, но не прерываем работу
    if (process.env.NODE_ENV === 'development') {
      console.warn('Unhandled promise rejection:', error);
    }
  });

  // Обработка общих ошибок
  window.addEventListener('error', (event) => {
    const errorMessage = event.message || String(event.error);
    
    // Игнорируем ошибки расширений браузера
    if (
      errorMessage.includes('Could not establish connection') ||
      errorMessage.includes('Receiving end does not exist') ||
      errorMessage.includes('Extension context invalidated') ||
      errorMessage.includes('message port closed') ||
      errorMessage.includes('chrome.runtime') ||
      errorMessage.includes('browser.runtime')
    ) {
      event.preventDefault();
      return;
    }
  });

  // Подавление ошибок от расширений в консоли
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const message = args.join(' ');
    if (
      message.includes('Could not establish connection') ||
      message.includes('Receiving end does not exist') ||
      message.includes('Extension context invalidated') ||
      message.includes('message port closed')
    ) {
      // Не логируем ошибки расширений
      return;
    }
    originalConsoleError.apply(console, args);
  };
}

