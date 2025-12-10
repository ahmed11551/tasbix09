/**
 * Типы для API ответов
 * Централизованные типы для всех API endpoints
 */

import type { DhikrLog, Goal, DailyAzkar } from '@prisma/client';

/**
 * Ответ на создание лога зикра
 */
export interface CreateDhikrLogResponse {
  log: DhikrLog;
  value_after: number;
  goal_progress?: {
    id: string;
    currentProgress: number;
    targetCount: number;
    status: string;
    isCompleted: boolean;
  } | null;
  daily_azkar?: DailyAzkar | null;
}

/**
 * Ответ на получение логов зикра
 */
export interface GetDhikrLogsResponse {
  logs: DhikrLog[];
}

/**
 * Ответ на получение целей
 */
export interface GetGoalsResponse {
  goals: Goal[];
}

/**
 * Ответ на создание/обновление цели
 */
export interface GoalResponse {
  goal: Goal;
}

/**
 * Ответ на получение ежедневных азкаров
 */
export interface DailyAzkarResponse {
  azkar: DailyAzkar;
}

/**
 * Ответ на получение статистики
 */
export interface StatsResponse {
  stats: {
    totalDhikrCount: number;
    goalsCompleted: number;
    currentStreak: number;
    todayCount: number;
  };
  counts: {
    habits: number;
    tasks: number;
    goals: number;
  };
}

/**
 * Ответ на получение избранного
 */
export interface FavoritesResponse {
  favorites: Array<{
    category: string;
    itemId: string;
  }>;
}

/**
 * Базовый ответ с ошибкой
 */
export interface ErrorResponse {
  error: string;
  message: string;
  details?: unknown;
  code?: string;
}

/**
 * Ответ на проверку лимита целей
 */
export interface GoalLimitResponse {
  allowed: boolean;
  current: number;
  limit: number;
  tier: string;
}

