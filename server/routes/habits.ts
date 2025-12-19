import { Router } from "express";
import { storage } from "../storage";
import { requireAuth, getUserId } from "../middleware/auth";
import { z } from "zod";
import { botReplikaGet, botReplikaPost, botReplikaPatch, botReplikaDelete, getUserIdForApi } from "../lib/bot-replika-api";
import { logger } from "../lib/logger";
import { formatZodError } from "../lib/user-friendly-errors";

const router = Router();
router.use(requireAuth);

// Zod схемы для валидации
const createHabitSchema = z.object({
  templateId: z.string().optional().nullable(),
  category: z.enum(['namaz', 'quran', 'dhikr', 'sadaqa', 'knowledge', 'fasting', 'etiquette']),
  subcategory: z.string().optional().nullable(),
  title: z.string().min(1, "Название привычки не может быть пустым").max(255, "Название привычки слишком длинное"),
  description: z.string().optional().nullable(),
  iconName: z.string().min(1, "Иконка должна быть указана"),
  difficulty: z.enum(['easy', 'medium', 'advanced']),
  repeatType: z.enum(['never', 'daily', 'weekly', 'monthly', 'custom']),
  repeatDays: z.array(z.string()).optional().default([]),
  repeatDates: z.array(z.number().int()).optional().default([]),
  startDate: z.string().datetime().or(z.date()).optional().nullable(),
  endDate: z.string().datetime().or(z.date()).optional().nullable(),
  time: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  isAllDay: z.boolean().optional().default(true),
  reminders: z.any().optional().default([]),
  calendarId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  url: z.union([z.string().url(), z.literal("")]).optional().nullable(),
  linkedToTasbih: z.boolean().optional().default(false),
  targetCount: z.number().int().positive().optional().nullable(),
  currentStreak: z.number().int().min(0).optional().default(0),
  longestStreak: z.number().int().min(0).optional().default(0),
  completedDates: z.array(z.string()).optional().default([]),
  isActive: z.boolean().optional().default(true),
});

const updateHabitSchema = createHabitSchema.partial();

router.get("/", async (req, res, next) => {
  try {
    // Авторизация отключена - всегда используем userId из заголовка или default-user
    const userId = getUserId(req) || (req as any).userId || "default-user";
    
    try {
      // Запрос к Bot.e-replika.ru API
      const apiUserId = getUserIdForApi(req);
      const data = await botReplikaGet<{ habits?: unknown[] }>("/api/habits", apiUserId);
      res.json({ habits: data.habits || data });
    } catch (apiError: any) {
      // Fallback на локальную БД если API недоступен
      logger.warn("Bot.e-replika.ru API unavailable, using local DB:", apiError.message);
      const habits = await storage.getHabits(userId);
      res.json({ habits });
    }
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    // Авторизация отключена - всегда используем userId из заголовка или default-user
    const userId = getUserId(req) || (req as any).userId || "default-user";
    
    try {
      const apiUserId = getUserIdForApi(req);
      const data = await botReplikaGet<{ habit?: unknown }>(`/api/habits/${req.params.id}`, apiUserId);
      const habit = data.habit || data;
      if (!habit) {
        return res.status(404).json({ error: "Habit not found" });
      }
      res.json({ habit });
    } catch (apiError: any) {
      // Fallback на локальную БД
      logger.warn("Bot.e-replika.ru API unavailable, using local DB:", apiError.message);
      const habit = await storage.getHabit(req.params.id, userId);
      if (!habit) {
        return res.status(404).json({ error: "Habit not found" });
      }
      res.json({ habit });
    }
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    // Авторизация отключена - всегда используем userId из заголовка или default-user
    const userId = getUserId(req) || (req as any).userId || "default-user";
    
    try {
      const apiUserId = getUserIdForApi(req);
      const data = await botReplikaPost<{ habit?: unknown }>("/api/habits", req.body, apiUserId);
      const habit = data.habit || data;
      res.status(201).json({ habit });
    } catch (apiError: any) {
      // Fallback на локальную БД
      logger.warn("Bot.e-replika.ru API unavailable, using local DB:", apiError.message);
      
      // Валидация через Zod схему
      let habitData;
      try {
        habitData = createHabitSchema.parse(req.body);
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          logger.error(`POST /api/habits: Validation error`, { 
            errors: validationError.errors,
            body: req.body,
            userId 
          });
          const userMessage = formatZodError(validationError);
          return res.status(400).json({ 
            error: "Validation error", 
            message: userMessage,
            details: validationError.errors.map(e => ({
              path: e.path.join('.'),
              message: e.message,
            }))
          });
        }
        throw validationError;
      }
      
      const habit = await storage.createHabit(userId, habitData);
      res.status(201).json({ habit });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const userMessage = formatZodError(error);
      return res.status(400).json({ 
        error: "Validation error", 
        message: userMessage,
        details: error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message,
        }))
      });
    }
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    // Авторизация отключена - всегда используем userId из заголовка или default-user
    const userId = getUserId(req) || (req as any).userId || "default-user";
    
    try {
      const apiUserId = getUserIdForApi(req);
      const data = await botReplikaPatch<{ habit?: unknown }>(`/api/habits/${req.params.id}`, req.body, apiUserId);
      const habit = data.habit || data;
      res.json({ habit });
    } catch (apiError: any) {
      logger.warn("Bot.e-replika.ru API unavailable, using local DB:", apiError.message);
      
      // Валидация через Zod схему
      let habitData;
      try {
        habitData = updateHabitSchema.parse(req.body);
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          logger.error(`PATCH /api/habits/:id: Validation error`, { 
            errors: validationError.errors,
            body: req.body,
            userId,
            habitId: req.params.id
          });
          const userMessage = formatZodError(validationError);
          return res.status(400).json({ 
            error: "Validation error", 
            message: userMessage,
            details: validationError.errors.map(e => ({
              path: e.path.join('.'),
              message: e.message,
            }))
          });
        }
        throw validationError;
      }
      
      const habit = await storage.updateHabit(req.params.id, userId, habitData);
      res.json({ habit });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const userMessage = formatZodError(error);
      return res.status(400).json({ 
        error: "Validation error", 
        message: userMessage,
        details: error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message,
        }))
      });
    }
    if (error instanceof Error && error.message === "Habit not found") {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    // Авторизация отключена - всегда используем userId из заголовка или default-user
    const userId = getUserId(req) || (req as any).userId || "default-user";
    
    try {
      const apiUserId = getUserIdForApi(req);
      await botReplikaDelete(`/api/habits/${req.params.id}`, apiUserId);
      res.json({ message: "Habit deleted successfully" });
    } catch (apiError: any) {
      logger.warn("Bot.e-replika.ru API unavailable, using local DB:", apiError.message);
      await storage.deleteHabit(req.params.id, userId);
      res.json({ message: "Habit deleted successfully" });
    }
  } catch (error) {
    next(error);
  }
});

export default router;

