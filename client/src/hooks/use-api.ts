import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { habitsApi, tasksApi, goalsApi, sessionsApi, dhikrApi, statsApi, qazaApi, badgesApi } from "@/lib/api";
import type { Habit, Task, Goal, Badge } from "@/lib/types";

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
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

