// Общий модуль для работы с Bot.e-replika.ru API
import { Request } from "express";

// Базовый URL API Bot.e-replika.ru
// Правильный URL: https://bot.e-replika.ru/api
const BOT_REPLIKA_API_BASE = process.env.BOT_REPLIKA_API_URL || "https://bot.e-replika.ru";
// Нормализуем URL: убираем trailing slash и добавляем /api если его нет
let apiUrl = BOT_REPLIKA_API_BASE.replace(/\/$/, '');
// Если в URL нет /api, добавляем его (но не добавляем если есть /docs)
if (!apiUrl.includes("/api") && !apiUrl.includes("/docs")) {
  apiUrl = apiUrl + "/api";
}
const BOT_REPLIKA_API_URL = apiUrl;
const TEST_TOKEN = process.env.TEST_TOKEN || "test_token_123";

export interface BotReplikaRequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  path: string;
  body?: unknown;
  userId?: string;
  token?: string;
}

/**
 * Проксирование запроса к Bot.e-replika.ru API
 */
export async function botReplikaRequest<T = unknown>(
  options: BotReplikaRequestOptions
): Promise<T> {
  const {
    method = "GET",
    path,
    body,
    userId,
    token = TEST_TOKEN,
  } = options;

  // Убираем начальный слэш если есть
  let apiPath = path.startsWith("/") ? path : `/${path}`;
  // Если путь начинается с /api, заменяем на пустую строку или оставляем как есть для /docs
  if (apiPath.startsWith("/api/")) {
    apiPath = apiPath.replace("/api", "");
  }
  const url = `${BOT_REPLIKA_API_URL}${apiPath}`;
  
  // Логирование для отладки
  console.log(`[DEBUG] Bot.e-replika.ru API request: ${method} ${url}`);

  const headers: HeadersInit = {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  if (userId) {
    headers["X-User-Id"] = userId;
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
  };

  if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
    fetchOptions.body = JSON.stringify(body);
  }

  try {
    // Создаем AbortController для timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 секунд timeout

    try {
      fetchOptions.signal = controller.signal;
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        throw new Error(
          `Bot.e-replika.ru API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      // Если ответ пустой (например, 204 No Content)
      if (response.status === 204 || response.headers.get("content-length") === "0") {
        return {} as T;
      }

      const data = await response.json();
      return data as T;
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      // Проверяем timeout
      if (fetchError.name === 'AbortError') {
        throw new Error(
          `Bot.e-replika.ru API request timeout after 30s. URL: ${url}`
        );
      }
      
      throw fetchError;
    }
  } catch (error: any) {
    // Если ошибка сети или API недоступен
    if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      throw new Error(
        `Bot.e-replika.ru API unavailable. Check BOT_REPLIKA_API_URL: ${BOT_REPLIKA_API_URL}`
      );
    }

    throw error;
  }
}

/**
 * Получить userId из request для использования в Bot.e-replika.ru API
 */
export function getUserIdForApi(req: Request): string {
  return (req as any).userId || req.session?.userId || "default-user";
}

/**
 * Проксирование GET запроса
 */
export async function botReplikaGet<T = unknown>(
  path: string,
  userId?: string
): Promise<T> {
  return botReplikaRequest<T>({ method: "GET", path, userId });
}

/**
 * Проксирование POST запроса
 */
export async function botReplikaPost<T = unknown>(
  path: string,
  body: unknown,
  userId?: string
): Promise<T> {
  return botReplikaRequest<T>({ method: "POST", path, body, userId });
}

/**
 * Проксирование PATCH запроса
 */
export async function botReplikaPatch<T = unknown>(
  path: string,
  body: unknown,
  userId?: string
): Promise<T> {
  return botReplikaRequest<T>({ method: "PATCH", path, body, userId });
}

/**
 * Проксирование DELETE запроса
 */
export async function botReplikaDelete<T = unknown>(
  path: string,
  userId?: string
): Promise<T> {
  return botReplikaRequest<T>({ method: "DELETE", path, userId });
}

