import { apiRequest } from "./queryClient";
import { getAuthToken, getUserId } from "./auth";

// Get auth options for API requests
function getAuthOptions() {
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
};

// Stats API
export const statsApi = {
  get: async () => {
    const res = await apiRequest("GET", "/api/stats", undefined, getAuthOptions());
    return res.json();
  },
};

