import { Router } from "express";
import { storage } from "../storage";
import { requireAuth, getUserId } from "../middleware/auth";
import { z } from "zod";
import { botReplikaGet, botReplikaPost, getUserIdForApi } from "../lib/bot-replika-api";
import { logger } from "../lib/logger";

const router = Router();
router.use(requireAuth);

// Получить каталог дуа и азкаров из Bot.e-replika.ru
router.get("/catalog", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const apiUserId = getUserIdForApi(req);
      const catalog = await botReplikaGet<{ catalog?: unknown }>("/api/dhikr/catalog", apiUserId);
      res.json({ catalog: catalog.catalog || catalog });
    } catch (apiError: any) {
      logger.error("Error fetching catalog from Bot.e-replika.ru:", apiError);
      return res.status(503).json({
        error: "Bot.e-replika.ru API unavailable",
        message: "Не удалось подключиться к API Bot.e-replika.ru. Проверьте BOT_REPLIKA_API_URL.",
      });
    }
  } catch (error) {
    next(error);
  }
});

// Получить каталог по категории
router.get("/catalog/:category", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const category = req.params.category; // dua, azkar, salawat, kalima

    try {
      const apiUserId = getUserIdForApi(req);
      const data = await botReplikaGet<{ items?: unknown[] }>(`/api/dhikr/catalog/${category}`, apiUserId);
      res.json({ items: data.items || data });
    } catch (apiError: any) {
      logger.error(`Error fetching catalog category ${category}:`, apiError);
      return res.status(503).json({
        error: "Bot.e-replika.ru API unavailable",
        message: "Не удалось подключиться к API Bot.e-replika.ru.",
      });
    }
  } catch (error) {
    next(error);
  }
});

router.get("/logs", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const apiUserId = getUserIdForApi(req);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const url = limit ? `/api/dhikr/logs?limit=${limit}` : "/api/dhikr/logs";
      const data = await botReplikaGet<{ logs?: unknown[] }>(url, apiUserId);
      res.json({ logs: data.logs || data });
    } catch (apiError: any) {
      logger.warn("Bot.e-replika.ru API unavailable, using local DB:", apiError.message);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const logs = await storage.getDhikrLogs(userId, limit);
      res.json({ logs });
    }
  } catch (error) {
    next(error);
  }
});

router.get("/logs/session/:sessionId", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const apiUserId = getUserIdForApi(req);
      const data = await botReplikaGet<{ logs?: unknown[] }>(`/api/dhikr/logs/session/${req.params.sessionId}`, apiUserId);
      res.json({ logs: data.logs || data });
    } catch (apiError: any) {
      logger.warn("Bot.e-replika.ru API unavailable, using local DB:", apiError.message);
      const logs = await storage.getDhikrLogsBySession(req.params.sessionId, userId);
      res.json({ logs });
    }
  } catch (error) {
    next(error);
  }
});

router.post("/logs", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const apiUserId = getUserIdForApi(req);
      const data = await botReplikaPost<{ log?: unknown }>("/api/dhikr/logs", req.body, apiUserId);
      const log = data.log || data;
      res.status(201).json({ log });
    } catch (apiError: any) {
      logger.warn("Bot.e-replika.ru API unavailable, using local DB:", apiError.message);
      const log = await storage.createDhikrLog(userId, req.body);
      res.status(201).json({ log });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    next(error);
  }
});

router.get("/daily-azkar/:dateLocal", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const apiUserId = getUserIdForApi(req);
      const data = await botReplikaGet<{ azkar?: unknown }>(`/api/dhikr/daily-azkar/${req.params.dateLocal}`, apiUserId);
      const azkar = data.azkar || data;
      if (!azkar) {
        return res.status(404).json({ error: "Daily azkar not found" });
      }
      res.json({ azkar });
    } catch (apiError: any) {
      logger.warn("Bot.e-replika.ru API unavailable, using local DB:", apiError.message);
      const azkar = await storage.getDailyAzkar(userId, req.params.dateLocal);
      if (!azkar) {
        return res.status(404).json({ error: "Daily azkar not found" });
      }
      res.json({ azkar });
    }
  } catch (error) {
    next(error);
  }
});

router.post("/daily-azkar", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const apiUserId = getUserIdForApi(req);
      const data = await botReplikaPost<{ azkar?: unknown }>("/api/dhikr/daily-azkar", req.body, apiUserId);
      const azkar = data.azkar || data;
      res.json({ azkar });
    } catch (apiError: any) {
      logger.warn("Bot.e-replika.ru API unavailable, using local DB:", apiError.message);
      const azkar = await storage.upsertDailyAzkar(userId, req.body);
      res.json({ azkar });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    next(error);
  }
});

export default router;

