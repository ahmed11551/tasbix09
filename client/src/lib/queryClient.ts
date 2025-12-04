import { QueryClient } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    let errorMessage = `${res.status}: ${text}`;
    let errorData: any = null;
    try {
      const json = JSON.parse(text);
      errorMessage = json.error || json.message || errorMessage;
      errorData = json; // Сохраняем весь объект ответа
    } catch {
      // Not JSON, use text as is
    }
    const error: any = new Error(errorMessage);
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
    res = await fetch(apiUrl, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });
  } catch (networkError: any) {
    // Обработка сетевых ошибок (нет интернета, сервер недоступен, CORS)
    const error: any = new Error(
      networkError.message || 'Сервер недоступен. Проверьте подключение к интернету.'
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
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Don't retry on 503 (Service Unavailable - БД недоступна)
        if (error?.status === 503) {
          return false;
        }
        // Retry up to 2 times for network errors
        return failureCount < 2;
      },
      onError: (error: any) => {
        // Логируем ошибки, но не крашим приложение
        console.error('Query error:', error);
        // Если это ошибка подключения к БД, показываем дружелюбное сообщение
        if (error?.status === 503) {
          console.warn('База данных временно недоступна. Проверьте подключение.');
        }
      },
    },
    mutations: {
      retry: false,
      onError: (error: any) => {
        // Логируем ошибки мутаций
        console.error('Mutation error:', error);
      },
    },
  },
});
