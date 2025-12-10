/**
 * Пользовательские сообщения об ошибках
 * Преобразует технические ошибки в понятные сообщения для пользователя
 */

export interface ErrorDetails {
  code?: string;
  status?: number;
  message?: string;
  field?: string;
}

/**
 * Пользовательские сообщения для различных типов ошибок
 */
const USER_FRIENDLY_MESSAGES: Record<string, string> = {
  // Prisma ошибки
  'P2025': 'Запись не найдена',
  'P2002': 'Такая запись уже существует',
  'P2003': 'Связанная запись не найдена',
  'P2014': 'Нарушение ограничений базы данных',
  'P2021': 'Таблица не существует',
  'P2025': 'Запись для обновления не найдена',
  
  // HTTP статусы
  '400': 'Неверные данные запроса',
  '401': 'Требуется авторизация',
  '403': 'Доступ запрещен',
  '404': 'Не найдено',
  '408': 'Превышено время ожидания',
  '409': 'Конфликт данных',
  '422': 'Ошибка валидации',
  '429': 'Слишком много запросов. Подождите немного',
  '500': 'Внутренняя ошибка сервера',
  '503': 'Сервис временно недоступен',
  
  // Специфичные ошибки приложения
  'VALIDATION_ERROR': 'Ошибка валидации данных',
  'NOT_FOUND': 'Запись не найдена',
  'ALREADY_EXISTS': 'Такая запись уже существует',
  'UNAUTHORIZED': 'Требуется авторизация',
  'FORBIDDEN': 'Доступ запрещен',
  'NETWORK_ERROR': 'Ошибка сети. Проверьте подключение к интернету',
  'TIMEOUT_ERROR': 'Превышено время ожидания. Попробуйте еще раз',
};

/**
 * Получить пользовательское сообщение об ошибке
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  // Если это уже строка, вернуть как есть
  if (typeof error === 'string') {
    return USER_FRIENDLY_MESSAGES[error] || error;
  }

  // Если это объект с кодом ошибки
  if (error && typeof error === 'object') {
    const err = error as ErrorDetails;
    
    // Проверяем Prisma код ошибки
    if (err.code && USER_FRIENDLY_MESSAGES[err.code]) {
      return USER_FRIENDLY_MESSAGES[err.code];
    }
    
    // Проверяем HTTP статус
    if (err.status && USER_FRIENDLY_MESSAGES[String(err.status)]) {
      return USER_FRIENDLY_MESSAGES[String(err.status)];
    }
    
    // Проверяем сообщение
    if (err.message) {
      // Пытаемся найти ключевое слово в сообщении
      const messageKey = Object.keys(USER_FRIENDLY_MESSAGES).find(key => 
        err.message?.toLowerCase().includes(key.toLowerCase())
      );
      if (messageKey) {
        return USER_FRIENDLY_MESSAGES[messageKey];
      }
      
      // Возвращаем сообщение, если оно понятное
      if (!err.message.includes('P') || !err.message.match(/^P\d{4}$/)) {
        return err.message;
      }
    }
  }

  // Если это Error объект
  if (error instanceof Error) {
    // Проверяем сетевые ошибки
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return USER_FRIENDLY_MESSAGES['NETWORK_ERROR'];
    }
    if (error.message.includes('timeout') || error.message.includes('aborted')) {
      return USER_FRIENDLY_MESSAGES['TIMEOUT_ERROR'];
    }
    
    return error.message;
  }

  // Дефолтное сообщение
  return 'Произошла ошибка. Попробуйте еще раз';
}

/**
 * Форматировать ошибку валидации Zod
 */
export function formatZodError(error: any): string {
  if (error?.errors && Array.isArray(error.errors)) {
    const firstError = error.errors[0];
    if (firstError?.path && firstError?.message) {
      const field = firstError.path.join('.');
      return `Поле "${field}": ${firstError.message}`;
    }
  }
  return getUserFriendlyErrorMessage(error);
}

