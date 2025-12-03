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
  
  const res = await fetch(apiUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

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
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
