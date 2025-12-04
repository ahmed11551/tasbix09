// Telegram WebApp SDK интеграция

// Проверка что мы в Telegram
export function isTelegramWebApp(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as any).Telegram?.WebApp;
}

// Получить WebApp объект
export function getTelegramWebApp() {
  if (typeof window === 'undefined') return null;
  return (window as any).Telegram?.WebApp || null;
}

// Инициализация Telegram WebApp
export function initTelegramWebApp() {
  if (typeof window === 'undefined') return null;
  
  const tg = (window as any).Telegram?.WebApp;
  if (!tg) return null;

  // Расширить на весь экран
  tg.expand();
  
  // Включить закрытие через кнопку (не поддерживается в версии 6.0+)
  try {
    if (tg.enableClosingConfirmation && typeof tg.enableClosingConfirmation === 'function') {
      tg.enableClosingConfirmation();
    }
  } catch (error) {
    // Игнорируем ошибку, если метод не поддерживается
    console.debug('enableClosingConfirmation not supported in this version');
  }
  
  // Настроить тему
  const theme = tg.colorScheme || 'light';
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  }
  
  // Слушать изменения темы
  tg.onEvent('themeChanged', () => {
    if (tg.colorScheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  });
  
  return tg;
}

// Получить данные пользователя
export function getTelegramUser() {
  const tg = getTelegramWebApp();
  return tg?.initDataUnsafe?.user || null;
}

// Получить initData для валидации
export function getTelegramInitData(): string | null {
  const tg = getTelegramWebApp();
  return tg?.initData || null;
}

// Отправить данные на бэкенд
export function sendDataToBackend(data: any) {
  const tg = getTelegramWebApp();
  if (!tg) return;
  
  tg.sendData(JSON.stringify(data));
}

// Показать главную кнопку
export function showMainButton(text: string, onClick: () => void) {
  const tg = getTelegramWebApp();
  if (!tg) return;
  
  tg.MainButton.setText(text);
  tg.MainButton.onClick(onClick);
  tg.MainButton.show();
}

// Скрыть главную кнопку
export function hideMainButton() {
  const tg = getTelegramWebApp();
  if (!tg) return;
  
  tg.MainButton.hide();
}

// Показать Back кнопку
export function showBackButton(onClick: () => void) {
  const tg = getTelegramWebApp();
  if (!tg) return;
  
  tg.BackButton.onClick(onClick);
  tg.BackButton.show();
}

// Скрыть Back кнопку
export function hideBackButton() {
  const tg = getTelegramWebApp();
  if (!tg) return;
  
  tg.BackButton.hide();
}

// Закрыть приложение
export function closeTelegramWebApp() {
  const tg = getTelegramWebApp();
  if (!tg) return;
  
  tg.close();
}

// Haptic Feedback
export function hapticFeedback(type: 'impact' | 'notification' | 'selection' = 'impact', style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium') {
  const tg = getTelegramWebApp();
  if (!tg?.HapticFeedback) return;
  
  if (type === 'impact') {
    tg.HapticFeedback.impactOccurred(style);
  } else if (type === 'notification') {
    tg.HapticFeedback.notificationOccurred(style === 'light' ? 'error' : 'success');
  } else {
    tg.HapticFeedback.selectionChanged();
  }
}

// Показать уведомление
export function showTelegramAlert(message: string) {
  const tg = getTelegramWebApp();
  if (!tg) return;
  
  tg.showAlert(message);
}

// Показать подтверждение
export function showTelegramConfirm(message: string): Promise<boolean> {
  const tg = getTelegramWebApp();
  if (!tg) return Promise.resolve(false);
  
  return new Promise((resolve) => {
    tg.showConfirm(message, (confirmed: boolean) => {
      resolve(confirmed);
    });
  });
}

// Получить версию платформы
export function getTelegramPlatform(): string | null {
  const tg = getTelegramWebApp();
  return tg?.platform || null;
}

// Проверить версию WebApp
export function getTelegramVersion(): string | null {
  const tg = getTelegramWebApp();
  return tg?.version || null;
}

