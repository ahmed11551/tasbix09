// This file is kept for type compatibility but not used in production
// We use Prisma storage (storage-prisma.ts) instead
// Uncomment below if you need to use Drizzle instead of Prisma

/*
import { 
  type User, 
  type InsertUser,
  type Habit,
  type InsertHabit,
  type Task,
  type InsertTask,
  type Goal,
  type InsertGoal,
  type Session,
  type InsertSession,
  type DhikrLog,
  type InsertDhikrLog,
  type DailyAzkar,
  type InsertDailyAzkar,
  type Badge,
  type InsertBadge,
  type CalendarEvent,
  type InsertCalendarEvent,
  users,
  habits,
  tasks,
  goals,
  sessions,
  dhikrLogs,
  dailyAzkar,
  badges,
  calendarEvents,
} from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "./db";
*/
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean>;
  hashPassword(password: string): Promise<string>;

  // Habits
  getHabits(userId: string): Promise<Habit[]>;
  getHabit(id: string, userId: string): Promise<Habit | undefined>;
  createHabit(userId: string, habit: InsertHabit): Promise<Habit>;
  updateHabit(id: string, userId: string, updates: Partial<InsertHabit>): Promise<Habit>;
  deleteHabit(id: string, userId: string): Promise<void>;

  // Tasks
  getTasks(userId: string): Promise<Task[]>;
  getTask(id: string, userId: string): Promise<Task | undefined>;
  createTask(userId: string, task: InsertTask): Promise<Task>;
  updateTask(id: string, userId: string, updates: Partial<InsertTask>): Promise<Task>;
  deleteTask(id: string, userId: string): Promise<void>;

  // Goals
  getGoals(userId: string): Promise<Goal[]>;
  getGoal(id: string, userId: string): Promise<Goal | undefined>;
  createGoal(userId: string, goal: InsertGoal): Promise<Goal>;
  updateGoal(id: string, userId: string, updates: Partial<InsertGoal>): Promise<Goal>;
  deleteGoal(id: string, userId: string): Promise<void>;

  // Sessions
  getSessions(userId: string): Promise<Session[]>;
  getSession(id: string, userId: string): Promise<Session | undefined>;
  createSession(userId: string, session: InsertSession): Promise<Session>;
  updateSession(id: string, userId: string, updates: Partial<InsertSession>): Promise<Session>;

  // Dhikr Logs
  getDhikrLogs(userId: string, limit?: number): Promise<DhikrLog[]>;
  getDhikrLogsBySession(sessionId: string, userId: string): Promise<DhikrLog[]>;
  createDhikrLog(userId: string, log: InsertDhikrLog): Promise<DhikrLog>;

  // Daily Azkar
  getDailyAzkar(userId: string, dateLocal: string): Promise<DailyAzkar | undefined>;
  upsertDailyAzkar(userId: string, data: InsertDailyAzkar): Promise<DailyAzkar>;

  // Badges
  getBadges(userId: string): Promise<Badge[]>;
  getBadge(id: string, userId: string): Promise<Badge | undefined>;
  createBadge(userId: string, badge: InsertBadge): Promise<Badge>;
  updateBadge(id: string, userId: string, updates: Partial<InsertBadge>): Promise<Badge>;

  // Calendar Events
  getCalendarEvents(userId: string, startDate?: Date, endDate?: Date): Promise<CalendarEvent[]>;
  getCalendarEvent(id: string, userId: string): Promise<CalendarEvent | undefined>;
  createCalendarEvent(userId: string, event: InsertCalendarEvent): Promise<CalendarEvent>;
  updateCalendarEvent(id: string, userId: string, updates: Partial<InsertCalendarEvent>): Promise<CalendarEvent>;
  deleteCalendarEvent(id: string, userId: string): Promise<void>;
}

export class DBStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const hashedPassword = await this.hashPassword(user.password);
    const result = await db.insert(users).values({
      ...user,
      password: hashedPassword,
    }).returning();
    return result[0];
  }

  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  // Habits
  async getHabits(userId: string): Promise<Habit[]> {
    return db.select().from(habits)
      .where(eq(habits.userId, userId))
      .orderBy(desc(habits.createdAt));
  }

  async getHabit(id: string, userId: string): Promise<Habit | undefined> {
    const result = await db.select().from(habits)
      .where(and(eq(habits.id, id), eq(habits.userId, userId)))
      .limit(1);
    return result[0];
  }

  async createHabit(userId: string, habit: InsertHabit): Promise<Habit> {
    const result = await db.insert(habits).values({
      ...habit,
      userId,
    }).returning();
    return result[0];
  }

  async updateHabit(id: string, userId: string, updates: Partial<InsertHabit>): Promise<Habit> {
    const result = await db.update(habits)
      .set(updates)
      .where(and(eq(habits.id, id), eq(habits.userId, userId)))
      .returning();
    if (!result[0]) {
      throw new Error("Habit not found");
    }
    return result[0];
  }

  async deleteHabit(id: string, userId: string): Promise<void> {
    await db.delete(habits)
      .where(and(eq(habits.id, id), eq(habits.userId, userId)));
  }

  // Tasks
  async getTasks(userId: string): Promise<Task[]> {
    return db.select().from(tasks)
      .where(eq(tasks.userId, userId))
      .orderBy(desc(tasks.createdAt));
  }

  async getTask(id: string, userId: string): Promise<Task | undefined> {
    const result = await db.select().from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .limit(1);
    return result[0];
  }

  async createTask(userId: string, task: InsertTask): Promise<Task> {
    const result = await db.insert(tasks).values({
      ...task,
      userId,
    }).returning();
    return result[0];
  }

  async updateTask(id: string, userId: string, updates: Partial<InsertTask>): Promise<Task> {
    const result = await db.update(tasks)
      .set(updates)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();
    if (!result[0]) {
      throw new Error("Task not found");
    }
    return result[0];
  }

  async deleteTask(id: string, userId: string): Promise<void> {
    await db.delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
  }

  // Goals
  async getGoals(userId: string): Promise<Goal[]> {
    return db.select().from(goals)
      .where(eq(goals.userId, userId))
      .orderBy(desc(goals.createdAt));
  }

  async getGoal(id: string, userId: string): Promise<Goal | undefined> {
    const result = await db.select().from(goals)
      .where(and(eq(goals.id, id), eq(goals.userId, userId)))
      .limit(1);
    return result[0];
  }

  async createGoal(userId: string, goal: InsertGoal): Promise<Goal> {
    const result = await db.insert(goals).values({
      ...goal,
      userId,
    }).returning();
    return result[0];
  }

  async updateGoal(id: string, userId: string, updates: Partial<InsertGoal>): Promise<Goal> {
    const result = await db.update(goals)
      .set(updates)
      .where(and(eq(goals.id, id), eq(goals.userId, userId)))
      .returning();
    if (!result[0]) {
      throw new Error("Goal not found");
    }
    return result[0];
  }

  async deleteGoal(id: string, userId: string): Promise<void> {
    await db.delete(goals)
      .where(and(eq(goals.id, id), eq(goals.userId, userId)));
  }

  // Sessions
  async getSessions(userId: string): Promise<Session[]> {
    return db.select().from(sessions)
      .where(eq(sessions.userId, userId))
      .orderBy(desc(sessions.startedAt));
  }

  async getSession(id: string, userId: string): Promise<Session | undefined> {
    const result = await db.select().from(sessions)
      .where(and(eq(sessions.id, id), eq(sessions.userId, userId)))
      .limit(1);
    return result[0];
  }

  async createSession(userId: string, session: InsertSession): Promise<Session> {
    const result = await db.insert(sessions).values({
      ...session,
      userId,
    }).returning();
    return result[0];
  }

  async updateSession(id: string, userId: string, updates: Partial<InsertSession>): Promise<Session> {
    const result = await db.update(sessions)
      .set(updates)
      .where(and(eq(sessions.id, id), eq(sessions.userId, userId)))
      .returning();
    if (!result[0]) {
      throw new Error("Session not found");
    }
    return result[0];
  }

  // Dhikr Logs
  async getDhikrLogs(userId: string, limit = 100): Promise<DhikrLog[]> {
    return db.select().from(dhikrLogs)
      .where(eq(dhikrLogs.userId, userId))
      .orderBy(desc(dhikrLogs.atTs))
      .limit(limit);
  }

  async getDhikrLogsBySession(sessionId: string, userId: string): Promise<DhikrLog[]> {
    return db.select().from(dhikrLogs)
      .where(and(
        eq(dhikrLogs.sessionId, sessionId),
        eq(dhikrLogs.userId, userId)
      ))
      .orderBy(dhikrLogs.atTs);
  }

  async createDhikrLog(userId: string, log: InsertDhikrLog): Promise<DhikrLog> {
    const result = await db.insert(dhikrLogs).values({
      ...log,
      userId,
      offlineId: log.offlineId || randomUUID(),
    }).returning();
    return result[0];
  }

  // Daily Azkar
  async getDailyAzkar(userId: string, dateLocal: string): Promise<DailyAzkar | undefined> {
    const result = await db.select().from(dailyAzkar)
      .where(and(
        eq(dailyAzkar.userId, userId),
        eq(dailyAzkar.dateLocal, dateLocal)
      ))
      .limit(1);
    return result[0];
  }

  async upsertDailyAzkar(userId: string, data: InsertDailyAzkar): Promise<DailyAzkar> {
    // Check if exists
    const existing = await this.getDailyAzkar(userId, data.dateLocal);
    
    if (existing) {
      const result = await db.update(dailyAzkar)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(and(
          eq(dailyAzkar.userId, userId),
          eq(dailyAzkar.dateLocal, data.dateLocal)
        ))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(dailyAzkar).values({
        ...data,
        userId,
      }).returning();
      return result[0];
    }
  }

  // Badges
  async getBadges(userId: string): Promise<Badge[]> {
    return db.select().from(badges)
      .where(eq(badges.userId, userId))
      .orderBy(desc(badges.achievedAt));
  }

  async getBadge(id: string, userId: string): Promise<Badge | undefined> {
    const result = await db.select().from(badges)
      .where(and(eq(badges.id, id), eq(badges.userId, userId)))
      .limit(1);
    return result[0];
  }

  async createBadge(userId: string, badge: InsertBadge): Promise<Badge> {
    const result = await db.insert(badges).values({
      ...badge,
      userId,
    }).returning();
    return result[0];
  }

  async updateBadge(id: string, userId: string, updates: Partial<InsertBadge>): Promise<Badge> {
    const result = await db.update(badges)
      .set(updates)
      .where(and(eq(badges.id, id), eq(badges.userId, userId)))
      .returning();
    if (!result[0]) {
      throw new Error("Badge not found");
    }
    return result[0];
  }

  // Calendar Events
  async getCalendarEvents(userId: string, startDate?: Date, endDate?: Date): Promise<CalendarEvent[]> {
    let query = db.select().from(calendarEvents)
      .where(eq(calendarEvents.userId, userId));
    
    if (startDate) {
      query = query.where(
        and(
          eq(calendarEvents.userId, userId),
          sql`${calendarEvents.startDate} >= ${startDate}`
        )
      ) as any;
    }
    
    if (endDate) {
      query = query.where(
        and(
          eq(calendarEvents.userId, userId),
          sql`${calendarEvents.endDate} <= ${endDate}`
        )
      ) as any;
    }
    
    return query.orderBy(calendarEvents.startDate) as Promise<CalendarEvent[]>;
  }

  async getCalendarEvent(id: string, userId: string): Promise<CalendarEvent | undefined> {
    const result = await db.select().from(calendarEvents)
      .where(and(eq(calendarEvents.id, id), eq(calendarEvents.userId, userId)))
      .limit(1);
    return result[0];
  }

  async createCalendarEvent(userId: string, event: InsertCalendarEvent): Promise<CalendarEvent> {
    const result = await db.insert(calendarEvents).values({
      ...event,
      userId,
    }).returning();
    return result[0];
  }

  async updateCalendarEvent(id: string, userId: string, updates: Partial<InsertCalendarEvent>): Promise<CalendarEvent> {
    const result = await db.update(calendarEvents)
      .set(updates)
      .where(and(eq(calendarEvents.id, id), eq(calendarEvents.userId, userId)))
      .returning();
    if (!result[0]) {
      throw new Error("Calendar event not found");
    }
    return result[0];
  }

  async deleteCalendarEvent(id: string, userId: string): Promise<void> {
    await db.delete(calendarEvents)
      .where(and(eq(calendarEvents.id, id), eq(calendarEvents.userId, userId)));
  }
}

// Using Prisma storage instead of Drizzle
import { storage as prismaStorage } from "./storage-prisma";
export const storage = prismaStorage;
