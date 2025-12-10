import { prisma } from "./db-prisma";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { logger } from "./lib/logger";
import type {
  User,
  Habit,
  Task,
  Goal,
  Session,
  DhikrLog,
  DailyAzkar,
  Badge,
  CategoryStreak,
  CalendarEvent,
  Prisma,
} from "@prisma/client";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | null>;
  getUserByUsername(username: string): Promise<User | null>;
  createUser(user: { username: string; password: string }): Promise<User>;
  verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean>;
  hashPassword(password: string): Promise<string>;

  // Habits
  getHabits(userId: string): Promise<Habit[]>;
  getHabit(id: string, userId: string): Promise<Habit | null>;
  createHabit(userId: string, habit: Prisma.HabitCreateInput): Promise<Habit>;
  updateHabit(id: string, userId: string, updates: Prisma.HabitUpdateInput): Promise<Habit>;
  deleteHabit(id: string, userId: string): Promise<void>;

  // Tasks
  getTasks(userId: string): Promise<Task[]>;
  getTask(id: string, userId: string): Promise<Task | null>;
  createTask(userId: string, task: Prisma.TaskCreateInput): Promise<Task>;
  updateTask(id: string, userId: string, updates: Prisma.TaskUpdateInput): Promise<Task>;
  deleteTask(id: string, userId: string): Promise<void>;

  // Goals
  getGoals(userId: string): Promise<Goal[]>;
  getGoal(id: string, userId: string): Promise<Goal | null>;
  createGoal(userId: string, goal: Prisma.GoalCreateInput): Promise<Goal>;
  updateGoal(id: string, userId: string, updates: Prisma.GoalUpdateInput): Promise<Goal>;
  deleteGoal(id: string, userId: string): Promise<void>;

  // Sessions
  getSessions(userId: string): Promise<Session[]>;
  getSession(id: string, userId: string): Promise<Session | null>;
  createSession(userId: string, session: Prisma.SessionCreateInput): Promise<Session>;
  updateSession(id: string, userId: string, updates: Prisma.SessionUpdateInput): Promise<Session>;

  // Dhikr Logs
  getDhikrLogs(userId: string, limit?: number): Promise<DhikrLog[]>;
  getDhikrLogsBySession(sessionId: string, userId: string): Promise<DhikrLog[]>;
  createDhikrLog(userId: string, log: Prisma.DhikrLogCreateInput): Promise<DhikrLog>;

  // Daily Azkar
  getDailyAzkar(userId: string, dateLocal: string): Promise<DailyAzkar | null>;
  upsertDailyAzkar(userId: string, data: Prisma.DailyAzkarCreateInput | Prisma.DailyAzkarUpdateInput): Promise<DailyAzkar>;

  // Badges
  getBadges(userId: string): Promise<Badge[]>;
  getBadge(id: string, userId: string): Promise<Badge | null>;
  createBadge(userId: string, badge: Omit<Prisma.BadgeCreateInput, 'user'>): Promise<Badge>;
  updateBadge(id: string, userId: string, updates: Prisma.BadgeUpdateInput): Promise<Badge>;

  // Calendar Events
  getCalendarEvents(userId: string, startDate?: Date, endDate?: Date): Promise<CalendarEvent[]>;
  getCalendarEvent(id: string, userId: string): Promise<CalendarEvent | null>;
  createCalendarEvent(userId: string, event: Prisma.CalendarEventCreateInput): Promise<CalendarEvent>;
  updateCalendarEvent(id: string, userId: string, updates: Prisma.CalendarEventUpdateInput): Promise<CalendarEvent>;
  deleteCalendarEvent(id: string, userId: string): Promise<void>;
  
  // Category Streaks
  getCategoryStreaks(userId: string): Promise<CategoryStreak[]>;
  getCategoryStreak(userId: string, category: string): Promise<CategoryStreak | null>;
  updateCategoryStreak(userId: string, category: string, data: Partial<CategoryStreak>): Promise<CategoryStreak>;
}

export class PrismaStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async getUserByUsername(username: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { username } });
  }

  async createUser(user: { username: string; password: string }): Promise<User> {
    const hashedPassword = await this.hashPassword(user.password);
    return prisma.user.create({
      data: {
        username: user.username,
        password: hashedPassword,
        // id не указываем - Prisma генерирует автоматически
      },
    });
  }

  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  // Habits
  async getHabits(userId: string): Promise<Habit[]> {
    return prisma.habit.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getHabit(id: string, userId: string): Promise<Habit | null> {
    return prisma.habit.findFirst({
      where: { id, userId },
    });
  }

  async createHabit(userId: string, habit: Prisma.HabitCreateInput): Promise<Habit> {
    // Преобразовать startDate в полный DateTime если это только дата
    const habitData: any = { ...habit };
    if (habitData.startDate && typeof habitData.startDate === 'string' && habitData.startDate.length === 10) {
      // Если только дата (YYYY-MM-DD), добавить время
      habitData.startDate = new Date(habitData.startDate + 'T00:00:00.000Z');
    }
    
    return prisma.habit.create({
      data: {
        ...habitData,
        user: { connect: { id: userId } },
      },
    });
  }

  async updateHabit(id: string, userId: string, updates: Prisma.HabitUpdateInput): Promise<Habit> {
    const habit = await prisma.habit.findFirst({ where: { id, userId } });
    if (!habit) throw new Error("Habit not found");

    return prisma.habit.update({
      where: { id },
      data: updates,
    });
  }

  async deleteHabit(id: string, userId: string): Promise<void> {
    await prisma.habit.deleteMany({
      where: { id, userId },
    });
  }

  // Tasks
  async getTasks(userId: string): Promise<Task[]> {
    return prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTask(id: string, userId: string): Promise<Task | null> {
    return prisma.task.findFirst({
      where: { id, userId },
    });
  }

  async createTask(userId: string, task: Prisma.TaskCreateInput): Promise<Task> {
    return prisma.task.create({
      data: {
        ...task,
        user: { connect: { id: userId } },
      },
    });
  }

  async updateTask(id: string, userId: string, updates: Prisma.TaskUpdateInput): Promise<Task> {
    const task = await prisma.task.findFirst({ where: { id, userId } });
    if (!task) throw new Error("Task not found");

    return prisma.task.update({
      where: { id },
      data: updates,
    });
  }

  async deleteTask(id: string, userId: string): Promise<void> {
    await prisma.task.deleteMany({
      where: { id, userId },
    });
  }

  // Goals
  async getGoals(userId: string): Promise<Goal[]> {
    return prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getGoal(id: string, userId: string): Promise<Goal | null> {
    return prisma.goal.findFirst({
      where: { id, userId },
    });
  }

  async createGoal(userId: string, goal: Prisma.GoalCreateInput): Promise<Goal> {
    return prisma.goal.create({
      data: {
        ...goal,
        user: { connect: { id: userId } },
      },
    });
  }

  async updateGoal(id: string, userId: string, updates: Prisma.GoalUpdateInput): Promise<Goal> {
    const goal = await prisma.goal.findFirst({ where: { id, userId } });
    if (!goal) throw new Error("Goal not found");

    return prisma.goal.update({
      where: { id },
      data: updates,
    });
  }

  async deleteGoal(id: string, userId: string): Promise<void> {
    await prisma.goal.deleteMany({
      where: { id, userId },
    });
  }

  // Sessions
  async getSessions(userId: string): Promise<Session[]> {
    return prisma.session.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
    });
  }

  async getSession(id: string, userId: string): Promise<Session | null> {
    return prisma.session.findFirst({
      where: { id, userId },
    });
  }

  async createSession(userId: string, session: Prisma.SessionCreateInput): Promise<Session> {
    // Преобразовать goalId в связь goal если он есть
    const { goalId, ...sessionData } = session as any;
    const createData: Prisma.SessionCreateInput = {
      ...sessionData,
      user: { connect: { id: userId } },
    };
    
    // Если есть goalId, создать связь с goal
    if (goalId) {
      createData.goal = { connect: { id: goalId } };
    }
    
    return prisma.session.create({
      data: createData,
    });
  }

  async updateSession(id: string, userId: string, updates: Prisma.SessionUpdateInput): Promise<Session> {
    const session = await prisma.session.findFirst({ where: { id, userId } });
    if (!session) throw new Error("Session not found");

    return prisma.session.update({
      where: { id },
      data: updates,
    });
  }

  // Dhikr Logs
  async getDhikrLogs(userId: string, limit = 100): Promise<DhikrLog[]> {
    return prisma.dhikrLog.findMany({
      where: { userId },
      orderBy: { atTs: 'desc' },
      take: limit,
    });
  }

  async getDhikrLogsBySession(sessionId: string, userId: string): Promise<DhikrLog[]> {
    return prisma.dhikrLog.findMany({
      where: {
        sessionId,
        userId,
      },
      orderBy: { atTs: 'asc' },
    });
  }

  async createDhikrLog(userId: string, log: Prisma.DhikrLogCreateInput): Promise<DhikrLog> {
    // Преобразовать sessionId в связь session и goalId в простое поле
    const { sessionId, goalId: rawGoalId, goal, ...logData } = log as any;
    
    // Обработать goalId - это простое поле String?, а не relation
    // Если передан объект goal (relation), игнорируем его
    const goalId = rawGoalId || null;
    
    const createData: Prisma.DhikrLogCreateInput = {
      ...logData,
      goalId: goalId, // Простое поле, не relation (убеждаемся что goal удален выше)
      offlineId: (logData.offlineId as string) || randomUUID(),
      user: { connect: { id: userId } },
    };
    
    // Session обязательна в схеме Prisma, поэтому либо используем существующую, либо создаем новую
    if (sessionId) {
      // Проверить, существует ли session
      const existingSession = await prisma.session.findUnique({ where: { id: sessionId } });
      if (existingSession) {
        createData.session = { connect: { id: sessionId } };
      } else {
        // Если session не существует, создать новую
        createData.session = {
          create: {
            userId,
            goalId: goalId, // Используем обработанный goalId
            prayerSegment: logData.prayerSegment || 'none',
            startedAt: new Date(),
          },
        };
      }
    } else {
      // Если sessionId не указан, создать новую session автоматически
      createData.session = {
        create: {
          userId,
          goalId: goalId, // Используем обработанный goalId
          prayerSegment: logData.prayerSegment || 'none',
          startedAt: new Date(),
        },
      };
    }
    
    try {
      return await prisma.dhikrLog.create({
        data: createData,
      });
    } catch (error: any) {
      // Логировать детали ошибки для отладки
      logger.error('Error creating dhikr log', {
        error: error.message,
        createData: {
          ...createData,
          session: typeof createData.session === 'object' ? '[relation]' : createData.session,
        },
        userId,
      });
      throw error;
    }
  }

  // Daily Azkar
  async getDailyAzkar(userId: string, dateLocal: string): Promise<DailyAzkar | null> {
    return prisma.dailyAzkar.findUnique({
      where: {
        userId_dateLocal: {
          userId,
          dateLocal,
        },
      },
    });
  }

  async upsertDailyAzkar(userId: string, data: Prisma.DailyAzkarCreateInput | Prisma.DailyAzkarUpdateInput): Promise<DailyAzkar> {
    const dateLocal = (data as any).dateLocal;
    return prisma.dailyAzkar.upsert({
      where: {
        userId_dateLocal: {
          userId,
          dateLocal,
        },
      },
      update: data as Prisma.DailyAzkarUpdateInput,
      create: {
        ...(data as Prisma.DailyAzkarCreateInput),
        user: { connect: { id: userId } },
      },
    });
  }

  // Badges
  async getBadges(userId: string): Promise<Badge[]> {
    return prisma.badge.findMany({
      where: { userId },
      orderBy: { achievedAt: 'desc' },
    });
  }

  async getBadge(id: string, userId: string): Promise<Badge | null> {
    return prisma.badge.findFirst({
      where: { id, userId },
    });
  }

  async createBadge(userId: string, badge: Omit<Prisma.BadgeCreateInput, 'user'>): Promise<Badge> {
    return prisma.badge.create({
      data: {
        ...badge,
        user: { connect: { id: userId } },
      },
    });
  }

  async updateBadge(id: string, userId: string, updates: Prisma.BadgeUpdateInput): Promise<Badge> {
    const badge = await prisma.badge.findFirst({ where: { id, userId } });
    if (!badge) throw new Error("Badge not found");

    return prisma.badge.update({
      where: { id },
      data: updates,
    });
  }

  // Calendar Events
  async getCalendarEvents(userId: string, startDate?: Date, endDate?: Date): Promise<CalendarEvent[]> {
    const where: Prisma.CalendarEventWhereInput = { userId };
    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) where.startDate.gte = startDate;
      if (endDate) where.startDate.lte = endDate;
    }

    return prisma.calendarEvent.findMany({
      where,
      orderBy: { startDate: 'asc' },
    });
  }

  async getCalendarEvent(id: string, userId: string): Promise<CalendarEvent | null> {
    return prisma.calendarEvent.findFirst({
      where: { id, userId },
    });
  }

  async createCalendarEvent(userId: string, event: Prisma.CalendarEventCreateInput): Promise<CalendarEvent> {
    return prisma.calendarEvent.create({
      data: {
        ...event,
        user: { connect: { id: userId } },
      },
    });
  }

  async updateCalendarEvent(id: string, userId: string, updates: Prisma.CalendarEventUpdateInput): Promise<CalendarEvent> {
    const event = await prisma.calendarEvent.findFirst({ where: { id, userId } });
    if (!event) throw new Error("Calendar event not found");

    return prisma.calendarEvent.update({
      where: { id },
      data: updates,
    });
  }

  async deleteCalendarEvent(id: string, userId: string): Promise<void> {
    await prisma.calendarEvent.deleteMany({
      where: { id, userId },
    });
  }

  // Category Streaks
  async getCategoryStreaks(userId: string): Promise<CategoryStreak[]> {
    return prisma.categoryStreak.findMany({
      where: { userId },
      orderBy: { category: 'asc' },
    });
  }

  async getCategoryStreak(userId: string, category: string): Promise<CategoryStreak | null> {
    return prisma.categoryStreak.findUnique({
      where: {
        userId_category: {
          userId,
          category,
        },
      },
    });
  }

  async updateCategoryStreak(userId: string, category: string, data: Partial<CategoryStreak>): Promise<CategoryStreak> {
    return prisma.categoryStreak.upsert({
      where: {
        userId_category: {
          userId,
          category,
        },
      },
      update: data as any,
      create: {
        userId,
        category,
        currentStreak: data.currentStreak || 0,
        longestStreak: data.longestStreak || 0,
        lastActivityDate: data.lastActivityDate || null,
      },
    });
  }
}

export const storage = new PrismaStorage();

