import { Router } from "express";
import { storage } from "../storage";
import { requireAuth, getUserId } from "../middleware/auth";
import { z } from "zod";
import { botReplikaGet, botReplikaPost, botReplikaPatch, botReplikaDelete, getUserIdForApi } from "../lib/bot-replika-api";
import { logger } from "../lib/logger";
import { prisma } from "../db-prisma";
import { formatZodError } from "../lib/user-friendly-errors";

const router = Router();
router.use(requireAuth);

// Zod схемы для валидации
const subtaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Название подзадачи не может быть пустым"),
  isCompleted: z.boolean(),
});

const reminderSchema = z.object({
  id: z.string(),
  time: z.string(),
  enabled: z.boolean(),
  sound: z.string().optional(),
});

const createTaskSchema = z.object({
  title: z.string().min(1, "Название задачи не может быть пустым").max(255, "Название задачи слишком длинное"),
  description: z.string().optional().nullable(),
  dueDate: z.string().datetime().or(z.date()).optional().nullable(),
  dueTime: z.string().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high']).optional().default('medium'),
  isCompleted: z.boolean().optional().default(false),
  completedAt: z.string().datetime().or(z.date()).optional().nullable(),
  subtasks: z.array(subtaskSchema).optional().default([]),
  reminders: z.array(reminderSchema).optional().default([]),
});

const updateTaskSchema = createTaskSchema.partial();

router.get("/", async (req, res, next) => {
  try {
    // Авторизация отключена - всегда используем userId из заголовка или default-user
    const userId = getUserId(req) || (req as any).userId || "default-user";
    
    try {
      const apiUserId = getUserIdForApi(req);
      const data = await botReplikaGet<{ tasks?: unknown[] }>("/api/tasks", apiUserId);
      res.json({ tasks: data.tasks || data });
    } catch (apiError: any) {
      logger.warn("Bot.e-replika.ru API unavailable, using local DB:", apiError.message);
      const tasks = await storage.getTasks(userId);
      res.json({ tasks });
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
      const data = await botReplikaGet<{ task?: unknown }>(`/api/tasks/${req.params.id}`, apiUserId);
      const task = data.task || data;
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json({ task });
    } catch (apiError: any) {
      logger.warn("Bot.e-replika.ru API unavailable, using local DB:", apiError.message);
      const task = await storage.getTask(req.params.id, userId);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json({ task });
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
      const data = await botReplikaPost<{ task?: unknown }>("/api/tasks", req.body, apiUserId);
      const task = data.task || data;
      res.status(201).json({ task });
    } catch (apiError: any) {
      logger.warn("Bot.e-replika.ru API unavailable, using local DB:", apiError.message);
      
      // Убедиться, что пользователь существует в БД
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        await prisma.user.create({
          data: {
            id: userId,
            username: userId === "default-user" ? `default-user-${Date.now()}` : userId,
            password: await storage.hashPassword("default-password"),
          },
        });
      }
      
      // Валидация через Zod схему
      let taskData;
      try {
        taskData = createTaskSchema.parse(req.body);
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          logger.error(`POST /api/tasks: Validation error`, { 
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
      
      try {
        const task = await storage.createTask(userId, taskData);
        res.status(201).json({ task });
      } catch (createError: any) {
        logger.error("Error creating task:", createError);
        // Улучшенная обработка ошибок Prisma
        if (createError.code === 'P2002') {
          return res.status(400).json({ 
            error: "Validation error", 
            message: "Задача с таким названием уже существует" 
          });
        }
        if (createError instanceof Error && createError.message.includes('prisma')) {
          return res.status(400).json({ 
            error: "Validation error", 
            message: createError.message || "Ошибка валидации данных при создании записи",
            details: createError 
          });
        }
        throw createError;
      }
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
      const data = await botReplikaPatch<{ task?: unknown }>(`/api/tasks/${req.params.id}`, req.body, apiUserId);
      const task = data.task || data;
      res.json({ task });
    } catch (apiError: any) {
      logger.warn("Bot.e-replika.ru API unavailable, using local DB:", apiError.message);
      
      // Валидация через Zod схему
      let taskData;
      try {
        taskData = updateTaskSchema.parse(req.body);
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          logger.error(`PATCH /api/tasks/:id: Validation error`, { 
            errors: validationError.errors,
            body: req.body,
            userId,
            taskId: req.params.id
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
      
      const task = await storage.updateTask(req.params.id, userId, taskData);
      res.json({ task });
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
    if (error instanceof Error && error.message === "Task not found") {
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
      await botReplikaDelete(`/api/tasks/${req.params.id}`, apiUserId);
      res.json({ message: "Task deleted successfully" });
    } catch (apiError: any) {
      logger.warn("Bot.e-replika.ru API unavailable, using local DB:", apiError.message);
      await storage.deleteTask(req.params.id, userId);
      res.json({ message: "Task deleted successfully" });
    }
  } catch (error) {
    next(error);
  }
});

export default router;

