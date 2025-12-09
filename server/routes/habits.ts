import { Router } from "express";
import { storage } from "../storage";
import { requireAuth, getUserId } from "../middleware/auth";
import { z } from "zod";
import { botReplikaGet, botReplikaPost, botReplikaPatch, botReplikaDelete, getUserIdForApi } from "../lib/bot-replika-api";
import { logger } from "../lib/logger";

const router = Router();
router.use(requireAuth);

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
      const parsed = req.body;
      const habit = await storage.createHabit(userId, parsed);
      res.status(201).json({ habit });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
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
      const parsed = req.body;
      const habit = await storage.updateHabit(req.params.id, userId, parsed);
      res.json({ habit });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
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

