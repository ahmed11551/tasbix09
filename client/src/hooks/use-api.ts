import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { habitsApi, tasksApi, goalsApi, sessionsApi, dhikrApi, statsApi, qazaApi, badgesApi, categoryStreaksApi, notificationSettingsApi, aiApi, type NotificationSettings } from "@/lib/api";
import type { Habit, Task, Goal, Badge, CategoryStreak } from "@/lib/types";

// Habits
export function useHabits() {
  return useQuery({
    queryKey: ["habits"],
    queryFn: async () => {
      const res = await habitsApi.getAll();
      return res.habits as Habit[];
    },
  });
}

export function useCreateHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: unknown) => {
      const res = await habitsApi.create(data);
      return res.habit as Habit;
    },
    onMutate: async (newHabit) => {
      await queryClient.cancelQueries({ queryKey: ["habits"] });
      
      const previousHabits = queryClient.getQueryData<Habit[]>(["habits"]);
      
      const optimisticHabit: Habit = {
        id: `temp-${Date.now()}`,
        userId: '',
        completedDates: [],
        ...(newHabit as Partial<Habit>),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Habit;
      
      queryClient.setQueryData<Habit[]>(["habits"], (old = []) => [...old, optimisticHabit]);
      
      return { previousHabits };
    },
    onError: (err, newHabit, context) => {
      if (context?.previousHabits) {
        queryClient.setQueryData(["habits"], context.previousHabits);
      }
    },
    onSuccess: (data) => {
      // Данные уже обновлены оптимистично в onMutate, просто заменяем временный объект на реальный
      queryClient.setQueryData<Habit[]>(["habits"], (old = []) => {
        const filtered = old.filter(h => !h.id.startsWith('temp-'));
        return [...filtered, data];
      });
      // Инвалидируем только stats, так как habits уже обновлен
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useUpdateHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: unknown }) => {
      const res = await habitsApi.update(id, data);
      return res.habit as Habit;
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["habits"] });
      
      const previousHabits = queryClient.getQueryData<Habit[]>(["habits"]);
      
      queryClient.setQueryData<Habit[]>(["habits"], (old = []) =>
        old.map(habit =>
          habit.id === id
            ? { ...habit, ...(data as Partial<Habit>), updatedAt: new Date().toISOString() }
            : habit
        )
      );
      
      return { previousHabits };
    },
    onError: (err, variables, context) => {
      if (context?.previousHabits) {
        queryClient.setQueryData(["habits"], context.previousHabits);
      }
    },
    onSuccess: (data) => {
      // Данные уже обновлены оптимистично в onMutate, просто синхронизируем с сервером
      queryClient.setQueryData<Habit[]>(["habits"], (old = []) =>
        old.map(habit => (habit.id === data.id ? data : habit))
      );
      // Инвалидируем только stats, так как habits уже обновлен
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useDeleteHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await habitsApi.delete(id);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["habits"] });
      
      const previousHabits = queryClient.getQueryData<Habit[]>(["habits"]);
      
      queryClient.setQueryData<Habit[]>(["habits"], (old = []) =>
        old.filter(habit => habit.id !== id)
      );
      
      return { previousHabits };
    },
    onError: (err, id, context) => {
      if (context?.previousHabits) {
        queryClient.setQueryData(["habits"], context.previousHabits);
      }
    },
    onSuccess: () => {
      // Данные уже обновлены оптимистично в onMutate через фильтрацию
      // Инвалидируем только stats, так как habits уже обновлен
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

// Tasks
export function useTasks() {
  return useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const res = await tasksApi.getAll();
      return res.tasks as Task[];
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: unknown) => {
      const res = await tasksApi.create(data);
      return res.task as Task;
    },
    onMutate: async (newTask) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      
      const previousTasks = queryClient.getQueryData<Task[]>(["tasks"]);
      
      const optimisticTask: Task = {
        id: `temp-${Date.now()}`,
        userId: '',
        isCompleted: false,
        subtasks: [],
        reminders: [],
        ...(newTask as Partial<Task>),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Task;
      
      queryClient.setQueryData<Task[]>(["tasks"], (old = []) => [...old, optimisticTask]);
      
      return { previousTasks };
    },
    onError: (err, newTask, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks"], context.previousTasks);
      }
    },
    onSuccess: (data) => {
      // Данные уже обновлены оптимистично в onMutate, просто заменяем временный объект на реальный
      queryClient.setQueryData<Task[]>(["tasks"], (old = []) => {
        const filtered = old.filter(t => !t.id.startsWith('temp-'));
        return [...filtered, data];
      });
      // Инвалидируем только stats, так как tasks уже обновлен
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: unknown }) => {
      const res = await tasksApi.update(id, data);
      return res.task as Task;
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      
      const previousTasks = queryClient.getQueryData<Task[]>(["tasks"]);
      
      queryClient.setQueryData<Task[]>(["tasks"], (old = []) =>
        old.map(task =>
          task.id === id
            ? { ...task, ...(data as Partial<Task>), updatedAt: new Date().toISOString() }
            : task
        )
      );
      
      return { previousTasks };
    },
    onError: (err, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks"], context.previousTasks);
      }
    },
    onSuccess: (data) => {
      // Данные уже обновлены оптимистично в onMutate, просто синхронизируем с сервером
      queryClient.setQueryData<Task[]>(["tasks"], (old = []) =>
        old.map(task => (task.id === data.id ? data : task))
      );
      // Инвалидируем только stats, так как tasks уже обновлен
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await tasksApi.delete(id);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      
      const previousTasks = queryClient.getQueryData<Task[]>(["tasks"]);
      
      queryClient.setQueryData<Task[]>(["tasks"], (old = []) =>
        old.filter(task => task.id !== id)
      );
      
      return { previousTasks };
    },
    onError: (err, id, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks"], context.previousTasks);
      }
    },
    onSuccess: () => {
      // Данные уже обновлены оптимистично в onMutate через фильтрацию
      // Инвалидируем только stats, так как tasks уже обновлен
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

// Goals
export function useGoals() {
  return useQuery({
    queryKey: ["goals"],
    queryFn: async () => {
      const res = await goalsApi.getAll();
      return res.goals as Goal[];
    },
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: unknown) => {
      const res = await goalsApi.create(data);
      return res.goal as Goal;
    },
    onMutate: async (newGoal) => {
      // Отменяем исходящие запросы, чтобы они не перезаписали оптимистичное обновление
      await queryClient.cancelQueries({ queryKey: ["goals"] });
      
      // Сохраняем предыдущее значение для отката
      const previousGoals = queryClient.getQueryData<Goal[]>(["goals"]);
      
      // Оптимистично обновляем кэш
      const optimisticGoal: Goal = {
        id: `temp-${Date.now()}`,
        userId: '',
        ...(newGoal as Partial<Goal>),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Goal;
      
      queryClient.setQueryData<Goal[]>(["goals"], (old = []) => [...old, optimisticGoal]);
      
      return { previousGoals };
    },
    onError: (err, newGoal, context) => {
      // Откатываем изменения при ошибке
      if (context?.previousGoals) {
        queryClient.setQueryData(["goals"], context.previousGoals);
      }
    },
    onSuccess: (data) => {
      // Данные уже обновлены оптимистично в onMutate, просто заменяем временный объект на реальный
      queryClient.setQueryData<Goal[]>(["goals"], (old = []) => {
        const filtered = old.filter(g => !g.id.startsWith('temp-'));
        return [...filtered, data];
      });
      // Данные уже обновлены, инвалидация не нужна
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: unknown }) => {
      const res = await goalsApi.update(id, data);
      return res.goal as Goal;
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["goals"] });
      
      const previousGoals = queryClient.getQueryData<Goal[]>(["goals"]);
      
      // Оптимистично обновляем цель
      queryClient.setQueryData<Goal[]>(["goals"], (old = []) =>
        old.map(goal =>
          goal.id === id
            ? { ...goal, ...(data as Partial<Goal>), updatedAt: new Date().toISOString() }
            : goal
        )
      );
      
      return { previousGoals };
    },
    onError: (err, variables, context) => {
      if (context?.previousGoals) {
        queryClient.setQueryData(["goals"], context.previousGoals);
      }
    },
    onSuccess: (data) => {
      // Данные уже обновлены оптимистично в onMutate, просто синхронизируем с сервером
      queryClient.setQueryData<Goal[]>(["goals"], (old = []) =>
        old.map(goal => (goal.id === data.id ? data : goal))
      );
      // Инвалидируем только stats, так как goals уже обновлен
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await goalsApi.delete(id);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["goals"] });
      
      const previousGoals = queryClient.getQueryData<Goal[]>(["goals"]);
      const deletedGoal = previousGoals?.find(g => g.id === id);
      
      // Оптимистично удаляем цель
      queryClient.setQueryData<Goal[]>(["goals"], (old = []) =>
        old.filter(goal => goal.id !== id)
      );
      
      return { previousGoals, deletedGoal };
    },
    onError: (err, id, context) => {
      if (context?.previousGoals) {
        queryClient.setQueryData(["goals"], context.previousGoals);
      }
    },
    onSuccess: () => {
      // Данные уже обновлены оптимистично в onMutate через фильтрацию
      // Инвалидируем только stats, так как goals уже обновлен
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

// Stats
export function useStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const res = await statsApi.get();
      return res;
    },
  });
}

// Sessions
export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: unknown) => {
      const res = await sessionsApi.create(data);
      return res.session;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

export function useUpdateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: unknown }) => {
      const res = await sessionsApi.update(id, data);
      return res.session;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["unfinished-sessions"] });
    },
  });
}

export function useUnfinishedSessions() {
  return useQuery({
    queryKey: ["unfinished-sessions"],
    queryFn: async () => {
      const res = await sessionsApi.getUnfinished();
      return res.sessions;
    },
  });
}

// Dhikr Logs
export function useCreateDhikrLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: unknown) => {
      const res = await dhikrApi.createLog(data);
      return res.log;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dhikr-logs"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

// Favorites
export function useFavorites() {
  return useQuery({
    queryKey: ["dhikr-favorites"],
    queryFn: async () => {
      const res = await dhikrApi.getFavorites();
      return res.favorites || [];
    },
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ category, itemId, isFavorite }: { category: string; itemId: string; isFavorite: boolean }) => {
      if (isFavorite) {
        await dhikrApi.removeFavorite(category, itemId);
      } else {
        await dhikrApi.addFavorite(category, itemId);
      }
      return { category, itemId, isFavorite: !isFavorite };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dhikr-favorites"] });
    },
  });
}

export function useDhikrCatalog() {
  return useQuery({
    queryKey: ["dhikr-catalog"],
    queryFn: async () => {
      try {
        const res = await dhikrApi.getCatalog();
        return res.catalog;
      } catch (error: any) {
        // Если API недоступен, возвращаем null (будет использован fallback на статические данные)
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.warn("Failed to load catalog from API, using fallback:", error);
        }
        return null;
      }
    },
    staleTime: 1000 * 60 * 60, // Кэшировать на 1 час
    retry: 1,
  });
}

export function useDhikrCatalogByCategory(category: string) {
  return useQuery({
    queryKey: ["dhikr-catalog", category],
    queryFn: async () => {
      try {
        const res = await dhikrApi.getCatalogByCategory(category);
        return res.items || [];
      } catch (error: any) {
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.warn(`Failed to load catalog for category ${category}, using fallback:`, error);
        }
        return null;
      }
    },
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });
}

export function useDailyAzkar(dateLocal: string) {
  return useQuery({
    queryKey: ["daily-azkar", dateLocal],
    queryFn: async () => {
      try {
        const res = await dhikrApi.getDailyAzkar(dateLocal);
        return res.azkar;
      } catch (error: any) {
        if (error.message?.includes("404")) {
          return null;
        }
        throw error;
      }
    },
  });
}

export function useUpsertDailyAzkar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: unknown) => {
      const res = await dhikrApi.upsertDailyAzkar(data);
      return res.azkar;
    },
    onSuccess: (_, variables: any) => {
      queryClient.invalidateQueries({ queryKey: ["daily-azkar", variables.dateLocal] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

// Qaza
export function useQazaDebt() {
  return useQuery({
    queryKey: ["qaza-debt"],
    queryFn: async () => {
      const res = await qazaApi.getDebt();
      return res.debt;
    },
  });
}

export function useCalculateQaza() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      gender: 'male' | 'female';
      birthYear?: number;
      prayerStartYear?: number;
      haydNifasPeriods?: Array<{ startDate: string; endDate: string; type: 'hayd' | 'nifas' }>;
      safarDays?: Array<{ startDate: string; endDate: string }>;
      manualPeriod?: { years: number; months: number };
    }) => {
      const res = await qazaApi.calculate(params);
      return res.debt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qaza-debt"] });
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}

export function useUpdateQazaProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ prayer, count }: { prayer: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | 'witr'; count: number }) => {
      const res = await qazaApi.updateProgress(prayer, count);
      return res.debt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qaza-debt"] });
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}

export function useMarkQazaCalendarDay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ dateLocal, prayers }: { dateLocal: string; prayers: { fajr?: boolean; dhuhr?: boolean; asr?: boolean; maghrib?: boolean; isha?: boolean; witr?: boolean } }) => {
      const res = await qazaApi.markCalendarDay(dateLocal, prayers);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qaza-debt"] });
      queryClient.invalidateQueries({ queryKey: ["qaza-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}

export function useQazaCalendar(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ["qaza-calendar", startDate, endDate],
    queryFn: async () => {
      const res = await qazaApi.getCalendar(startDate, endDate);
      return res.entries;
    },
  });
}

export function useCreateQazaGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await qazaApi.createGoal();
      return res.goal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["qaza-debt"] });
    },
  });
}

// Badges
export function useBadges() {
  return useQuery({
    queryKey: ["badges"],
    queryFn: async () => {
      const res = await badgesApi.getAll();
      return res.badges as Badge[];
    },
  });
}

export function useCheckBadges() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await badgesApi.check();
      return res.newBadges;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["badges"] });
    },
  });
}

// Category Streaks
export function useCategoryStreaks() {
  return useQuery({
    queryKey: ["category-streaks"],
    queryFn: async () => {
      const res = await categoryStreaksApi.getAll();
      return res.streaks as CategoryStreak[];
    },
  });
}

export function useCategoryStreak(category: 'prayer' | 'quran' | 'dhikr') {
  return useQuery({
    queryKey: ["category-streak", category],
    queryFn: async () => {
      const res = await categoryStreaksApi.getByCategory(category);
      return res.streak as CategoryStreak;
    },
  });
}

export function useUpdateCategoryStreaks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await categoryStreaksApi.update();
      return res.streaks;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category-streaks"] });
      queryClient.invalidateQueries({ queryKey: ["category-streak"] });
    },
  });
}

// Notification Settings
export function useNotificationSettings() {
  return useQuery({
    queryKey: ["notification-settings"],
    queryFn: async () => {
      const res = await notificationSettingsApi.get();
      return res.settings;
    },
  });
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<NotificationSettings>) => {
      const res = await notificationSettingsApi.update(data);
      return res.settings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-settings"] });
    },
  });
}

export function useTestNotification() {
  return useMutation({
    mutationFn: notificationSettingsApi.test,
  });
}

// AI Reports
export function useAIReport(period: 'week' | 'month' | 'quarter' | 'year' = 'week') {
  return useQuery({
    queryKey: ["ai-report", period],
    queryFn: async () => {
      const res = await aiApi.getReport(period);
      return res.report;
    },
    staleTime: 1000 * 60 * 60, // 1 час
    retry: 1,
  });
}

// Reports
export function useDailyReport(date?: string) {
  return useQuery({
    queryKey: ["daily-report", date],
    queryFn: async () => {
      const { reportsApi } = await import("../lib/api");
      const res = await reportsApi.getDaily(date);
      return res;
    },
  });
}

export function useActivityHeatmap(params?: {
  startDate?: string;
  endDate?: string;
  days?: number;
}) {
  return useQuery({
    queryKey: ["activity-heatmap", params],
    queryFn: async () => {
      const { reportsApi } = await import("../lib/api");
      const res = await reportsApi.getActivityHeatmap(params);
      return res.data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 минут
  });
}

// Learn
export function useLearnMark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (goalId: string) => {
      const { learnApi } = await import("../lib/api");
      const res = await learnApi.mark(goalId);
      return res.goal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["dhikr-logs"] });
    },
  });
}

// Dhikr Logs - Delete Last (Undo)
export function useDeleteLastDhikrLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId?: string) => {
      const { dhikrApi } = await import("../lib/api");
      const res = await dhikrApi.deleteLastLog(sessionId);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dhikr-logs"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["daily-azkar"] });
    },
  });
}

