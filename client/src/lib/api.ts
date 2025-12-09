import { apiRequest } from "./queryClient";
import { getAuthToken, getUserId } from "./auth";
import type { QazaDebt, QazaCalendarEntry, Badge, CategoryStreak, Goal } from "./types";

// Get auth options for API requests
export function getAuthOptions() {
  const token = getAuthToken();
  const userId = getUserId();
  
  // Если нет токена/ID, использовать дефолтные значения для тестирования
  return {
    token: token || 'test_token_123',
    userId: userId || 'default-user',
  };
}

export interface AuthResponse {
  user: {
    id: string;
    username: string;
  };
  token?: string;
}

export interface ApiError {
  error: string;
  details?: unknown;
}

// Auth API
export const authApi = {
  register: async (username: string, password: string): Promise<AuthResponse> => {
    const res = await apiRequest("POST", "/api/auth/register", { username, password });
    return res.json();
  },
  
  login: async (username: string, password: string): Promise<AuthResponse> => {
    const res = await apiRequest("POST", "/api/auth/login", { username, password });
    return res.json();
  },
  
  createGuest: async (): Promise<AuthResponse> => {
    const res = await apiRequest("POST", "/api/auth/guest", undefined, { credentials: 'include' });
    return res.json();
  },
  
  logout: async (): Promise<void> => {
    await apiRequest("POST", "/api/auth/logout", undefined, getAuthOptions());
  },
  
  me: async (): Promise<AuthResponse> => {
    const res = await apiRequest("GET", "/api/auth/me", undefined, getAuthOptions());
    return res.json();
  },
  
  validateToken: async (token: string, userId?: string): Promise<{ valid: boolean }> => {
    const res = await apiRequest("POST", "/api/auth/validate-token", { token, userId });
    return res.json();
  },
};

// Habits API
export const habitsApi = {
  getAll: async () => {
    const res = await apiRequest("GET", "/api/habits", undefined, getAuthOptions());
    return res.json();
  },
  
  getById: async (id: string) => {
    const res = await apiRequest("GET", `/api/habits/${id}`, undefined, getAuthOptions());
    return res.json();
  },
  
  create: async (data: unknown) => {
    const res = await apiRequest("POST", "/api/habits", data, getAuthOptions());
    return res.json();
  },
  
  update: async (id: string, data: unknown) => {
    const res = await apiRequest("PATCH", `/api/habits/${id}`, data, getAuthOptions());
    return res.json();
  },
  
  delete: async (id: string) => {
    await apiRequest("DELETE", `/api/habits/${id}`, undefined, getAuthOptions());
  },
};

// Tasks API
export const tasksApi = {
  getAll: async () => {
    const res = await apiRequest("GET", "/api/tasks", undefined, getAuthOptions());
    return res.json();
  },
  
  getById: async (id: string) => {
    const res = await apiRequest("GET", `/api/tasks/${id}`, undefined, getAuthOptions());
    return res.json();
  },
  
  create: async (data: unknown) => {
    const res = await apiRequest("POST", "/api/tasks", data, getAuthOptions());
    return res.json();
  },
  
  update: async (id: string, data: unknown) => {
    const res = await apiRequest("PATCH", `/api/tasks/${id}`, data, getAuthOptions());
    return res.json();
  },
  
  delete: async (id: string) => {
    await apiRequest("DELETE", `/api/tasks/${id}`, undefined, getAuthOptions());
  },
};

// Goals API
export const goalsApi = {
  getAll: async () => {
    const res = await apiRequest("GET", "/api/goals", undefined, getAuthOptions());
    return res.json();
  },
  
  getById: async (id: string) => {
    const res = await apiRequest("GET", `/api/goals/${id}`, undefined, getAuthOptions());
    return res.json();
  },
  
  create: async (data: unknown) => {
    const res = await apiRequest("POST", "/api/goals", data, getAuthOptions());
    return res.json();
  },
  
  update: async (id: string, data: unknown) => {
    const res = await apiRequest("PATCH", `/api/goals/${id}`, data, getAuthOptions());
    return res.json();
  },
  
  delete: async (id: string) => {
    await apiRequest("DELETE", `/api/goals/${id}`, undefined, getAuthOptions());
  },
};

// Sessions API
export const sessionsApi = {
  getAll: async () => {
    const res = await apiRequest("GET", "/api/sessions", undefined, getAuthOptions());
    return res.json();
  },
  
  getById: async (id: string) => {
    const res = await apiRequest("GET", `/api/sessions/${id}`, undefined, getAuthOptions());
    return res.json();
  },
  
  getUnfinished: async () => {
    const res = await apiRequest("GET", "/api/sessions/unfinished", undefined, getAuthOptions());
    return res.json();
  },
  
  create: async (data: unknown) => {
    const res = await apiRequest("POST", "/api/sessions", data, getAuthOptions());
    return res.json();
  },
  
  update: async (id: string, data: unknown) => {
    const res = await apiRequest("PATCH", `/api/sessions/${id}`, data, getAuthOptions());
    return res.json();
  },
};

// Dhikr API
export const dhikrApi = {
  getCatalog: async () => {
    const res = await apiRequest("GET", "/api/dhikr/catalog", undefined, getAuthOptions());
    return res.json();
  },
  
  getCatalogByCategory: async (category: string) => {
    const res = await apiRequest("GET", `/api/dhikr/catalog/${category}`, undefined, getAuthOptions());
    return res.json();
  },
  
  getLogs: async (limit?: number) => {
    const url = limit ? `/api/dhikr/logs?limit=${limit}` : "/api/dhikr/logs";
    const res = await apiRequest("GET", url, undefined, getAuthOptions());
    return res.json();
  },
  
  getLogsBySession: async (sessionId: string) => {
    const res = await apiRequest("GET", `/api/dhikr/logs/session/${sessionId}`, undefined, getAuthOptions());
    return res.json();
  },
  
  createLog: async (data: unknown) => {
    const res = await apiRequest("POST", "/api/dhikr/logs", data, getAuthOptions());
    return res.json();
  },
  
  getDailyAzkar: async (dateLocal: string) => {
    const res = await apiRequest("GET", `/api/dhikr/daily-azkar/${dateLocal}`, undefined, getAuthOptions());
    return res.json();
  },
  
  upsertDailyAzkar: async (data: unknown) => {
    const res = await apiRequest("POST", "/api/dhikr/daily-azkar", data, getAuthOptions());
    return res.json();
  },
  
  deleteLastLog: async (sessionId?: string) => {
    const url = sessionId 
      ? `/api/dhikr/logs/last?sessionId=${sessionId}`
      : '/api/dhikr/logs/last';
    const res = await apiRequest("DELETE", url, undefined, getAuthOptions());
    // API может вернуть 200 с deleted: false, что не является ошибкой
    if (!res.ok && res.status !== 200) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `HTTP ${res.status}`);
    }
    return res.json();
  },
};

// Reports API
export const reportsApi = {
  getDaily: async (date?: string) => {
    const url = date ? `/api/v1/reports/daily?date=${date}` : '/api/v1/reports/daily';
    const res = await apiRequest("GET", url, undefined, getAuthOptions());
    return res.json();
  },
  
  getActivityHeatmap: async (params?: {
    startDate?: string;
    endDate?: string;
    days?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.days) queryParams.append('days', params.days.toString());
    
    const query = queryParams.toString();
    const url = `/api/v1/reports/activity-heatmap${query ? `?${query}` : ''}`;
    const res = await apiRequest("GET", url, undefined, getAuthOptions());
    return res.json();
  },
};

// Learn API
export const learnApi = {
  mark: async (goalId: string) => {
    const res = await apiRequest("POST", "/api/v1/learn/mark", { goal_id: goalId }, getAuthOptions());
    return res.json();
  },
};

// Stats API
export const statsApi = {
  get: async () => {
    const res = await apiRequest("GET", "/api/stats", undefined, getAuthOptions());
    return res.json();
  },
};

import type { AIContext } from "./types";

// AI API
export const aiApi = {
  assistant: async (message: string, context?: AIContext): Promise<{ response: string }> => {
    const res = await apiRequest("POST", "/api/ai/assistant", { message, context }, getAuthOptions());
    return res.json();
  },
  
  getReport: async (period: 'week' | 'month' | 'quarter' | 'year' = 'week'): Promise<{ report: any }> => {
    const res = await apiRequest("GET", `/api/ai/report?period=${period}`, undefined, getAuthOptions());
    return res.json();
  },
};

// Qaza API
export const qazaApi = {
  getDebt: async (): Promise<{ debt: QazaDebt | null }> => {
    const res = await apiRequest("GET", "/api/qaza", undefined, getAuthOptions());
    return res.json();
  },
  
  calculate: async (params: {
    gender: 'male' | 'female';
    birthYear?: number;
    prayerStartYear?: number;
    haydNifasPeriods?: Array<{ startDate: string; endDate: string; type: 'hayd' | 'nifas' }>;
    safarDays?: Array<{ startDate: string; endDate: string }>;
    manualPeriod?: { years: number; months: number };
  }): Promise<{ debt: QazaDebt }> => {
    const res = await apiRequest("POST", "/api/qaza/calculate", params, getAuthOptions());
    return res.json();
  },
  
  updateProgress: async (prayer: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | 'witr', count: number): Promise<{ debt: QazaDebt }> => {
    const res = await apiRequest("PATCH", "/api/qaza/progress", { prayer, count }, getAuthOptions());
    return res.json();
  },
  
  markCalendarDay: async (dateLocal: string, prayers: {
    fajr?: boolean;
    dhuhr?: boolean;
    asr?: boolean;
    maghrib?: boolean;
    isha?: boolean;
    witr?: boolean;
  }): Promise<{ entry: QazaCalendarEntry; progress: Record<string, number> }> => {
    const res = await apiRequest("POST", "/api/qaza/calendar/mark", { dateLocal, prayers }, getAuthOptions());
    return res.json();
  },
  
  getCalendar: async (startDate?: string, endDate?: string): Promise<{ entries: QazaCalendarEntry[] }> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const query = params.toString();
    const res = await apiRequest("GET", `/api/qaza/calendar${query ? `?${query}` : ''}`, undefined, getAuthOptions());
    return res.json();
  },
  
  createGoal: async (): Promise<{ goal: Goal }> => {
    const res = await apiRequest("POST", "/api/qaza/create-goal", undefined, getAuthOptions());
    return res.json();
  },
};

// Badges API
export const badgesApi = {
  getAll: async (): Promise<{ badges: Badge[]; newBadges?: Badge[] }> => {
    const res = await apiRequest("GET", "/api/badges", undefined, getAuthOptions());
    return res.json();
  },
  
  check: async (): Promise<{ newBadges: Badge[] }> => {
    const res = await apiRequest("POST", "/api/badges/check", undefined, getAuthOptions());
    return res.json();
  },
  
  getById: async (id: string): Promise<{ badge: Badge }> => {
    const res = await apiRequest("GET", `/api/badges/${id}`, undefined, getAuthOptions());
    return res.json();
  },
};

// Category Streaks API
export const categoryStreaksApi = {
  getAll: async (): Promise<{ streaks: CategoryStreak[] }> => {
    const res = await apiRequest("GET", "/api/category-streaks", undefined, getAuthOptions());
    return res.json();
  },
  
  getByCategory: async (category: string): Promise<{ streak: CategoryStreak }> => {
    const res = await apiRequest("GET", `/api/category-streaks/${category}`, undefined, getAuthOptions());
    return res.json();
  },
  
  update: async (): Promise<{ success: boolean; streaks: CategoryStreak[] }> => {
    const res = await apiRequest("POST", "/api/category-streaks/update", undefined, getAuthOptions());
    return res.json();
  },
};

// Notification Settings API
export interface NotificationSettings {
  notificationsEnabled: boolean;
  notificationTime: string;
  notificationDays: string[];
  telegramId?: string;
  firstName?: string;
}

export const notificationSettingsApi = {
  get: async (): Promise<{ settings: NotificationSettings }> => {
    const res = await apiRequest("GET", "/api/notification-settings", undefined, getAuthOptions());
    return res.json();
  },
  
  update: async (data: Partial<NotificationSettings>): Promise<{ settings: NotificationSettings }> => {
    const res = await apiRequest("PUT", "/api/notification-settings", data, getAuthOptions());
    return res.json();
  },
  
  test: async (): Promise<{ success: boolean; message?: string }> => {
    const res = await apiRequest("POST", "/api/notification-settings/test", {}, getAuthOptions());
    return res.json();
  },
};

