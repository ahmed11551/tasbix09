import { QueryClient } from "@tanstack/react-query";

/**
 * Пользовательские сообщения об ошибках
 */
const USER_FRIENDLY_MESSAGES: Record<string, string> = {
  '400': 'Неверные данные запроса',
  '401': 'Требуется авторизация',
  '403': 'Доступ запрещен',
  '404': 'Не найдено',
  '408': 'Превышено время ожидания. Попробуйте еще раз',
  '409': 'Конфликт данных',
  '422': 'Ошибка валидации',
  '429': 'Слишком много запросов. Подождите немного',
  '500': 'Внутренняя ошибка сервера',
  '503': 'Сервис временно недоступен',
  'NETWORK_ERROR': 'Ошибка сети. Проверьте подключение к интернету',
  'TIMEOUT_ERROR': 'Превышено время ожидания. Попробуйте еще раз',
};

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    let errorMessage = `${res.status}: ${text}`;
    let errorData: Record<string, unknown> | null = null;
    try {
      const json = JSON.parse(text);
      // Используем пользовательское сообщение из ответа, если есть
      const userMessage = (json.message as string) || (json.error as string);
      if (userMessage) {
        errorMessage = userMessage;
      } else {
        // Используем стандартные сообщения для статусов
        errorMessage = USER_FRIENDLY_MESSAGES[String(res.status)] || errorMessage;
      }
      errorData = json; // Сохраняем весь объект ответа
    } catch {
      // Not JSON, use text as is, но пробуем найти стандартное сообщение
      errorMessage = USER_FRIENDLY_MESSAGES[String(res.status)] || errorMessage;
    }
    interface ApiError extends Error {
      status?: number;
      response?: Response;
      responseData?: Record<string, unknown> | null;
      isNetworkError?: boolean;
      isTimeoutError?: boolean;
    }
    const error: ApiError = new Error(errorMessage);
    error.status = res.status;
    error.response = res;
    error.responseData = errorData; // Добавляем данные ответа
    throw error;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: {
    token?: string;
    userId?: string;
  }
): Promise<Response> {
  const headers: HeadersInit = data ? { "Content-Type": "application/json" } : {};
  
  // Add token auth if provided
  if (options?.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
    if (options.userId) {
      headers["X-User-Id"] = options.userId;
    }
  }
  
  // Использовать абсолютный URL для API запросов
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const apiUrl = url.startsWith('/') ? `${baseUrl}${url}` : url;
  
  let res: Response;
  try {
    // Добавляем timeout для fetch запросов
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 секунд

    try {
      res = await fetch(apiUrl, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        credentials: "include",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        const timeoutError: any = new Error(USER_FRIENDLY_MESSAGES['TIMEOUT_ERROR'] || 'Request timeout after 30s');
        timeoutError.status = 408;
        timeoutError.isTimeoutError = true;
        throw timeoutError;
      }
      
      throw fetchError;
    }
  } catch (networkError: any) {
      // Обработка сетевых ошибок (нет интернета, сервер недоступен, CORS)
      interface NetworkError extends Error {
        status?: number;
        isNetworkError?: boolean;
      }
      const error: NetworkError = new Error(
        USER_FRIENDLY_MESSAGES['NETWORK_ERROR'] || 'Сервер недоступен. Проверьте подключение к интернету.'
      );
      error.status = 0;
      error.isNetworkError = true;
      throw error;
  }

  await throwIfResNotOk(res);
  return res;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 30000, // 30 seconds
      retry: (failureCount, error: unknown) => {
        const err = error as { status?: number };
        // Don't retry on 4xx errors (client errors)
        if (err?.status && err.status >= 400 && err.status < 500) {
          return false;
        }
        // Don't retry on 503 (Service Unavailable - БД недоступна)
        if (err?.status === 503) {
          return false;
        }
        // Retry up to 2 times for network errors
        return failureCount < 2;
      },
      onError: (error: unknown) => {
        // Ошибки обрабатываются через React Query UI компоненты
        if (process.env.NODE_ENV === 'development') {
          const err = error as { status?: number };
          if (err?.status === 503) {
            // eslint-disable-next-line no-console
            console.error('Database unavailable');
          }
        }
      },
    },
    mutations: {
      retry: false,
      onError: (error: unknown) => {
        // Ошибки обрабатываются через React Query UI компоненты
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.error('Mutation error:', error);
        }
      },
    },
  },
});
