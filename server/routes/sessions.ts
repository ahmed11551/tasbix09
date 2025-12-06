import { Router } from "express";
import { storage } from "../storage";
import { requireAuth, getUserId } from "../middleware/auth";
import { z } from "zod";
import { botReplikaGet, botReplikaPost, botReplikaPatch, getUserIdForApi } from "../lib/bot-replika-api";
import { logger } from "../lib/logger";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const apiUserId = getUserIdForApi(req);
      const data = await botReplikaGet<{ sessions?: unknown[] }>("/api/sessions", apiUserId);
      res.json({ sessions: data.sessions || data });
    } catch (apiError: any) {
      logger.warn("Bot.e-replika.ru API unavailable, using local DB:", apiError.message);
      const sessions = await storage.getSessions(userId);
      res.json({ sessions });
    }
  } catch (error) {
    next(error);
  }
});

// GET /api/sessions/unfinished - получить незавершенные сессии
router.get("/unfinished", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const apiUserId = getUserIdForApi(req);
      const data = await botReplikaGet<{ sessions?: unknown[] }>("/api/sessions/unfinished", apiUserId);
      res.json({ sessions: data.sessions || data });
      return;
    } catch (apiError: any) {
      logger.warn("Bot.e-replika.ru API unavailable, using local DB:", apiError.message);
      // Продолжаем с локальной БД
    }
  
    // Fallback на локальную БД
    const { prisma } = await import("../db-prisma");
    
    // Получить незавершенные сессии (endedAt === null)
    const unfinishedSessions = await prisma.session.findMany({
      where: {
        userId,
        endedAt: null,
      },
      include: {
        goal: true,
      },
      orderBy: {
        startedAt: 'desc',
      },
      take: 5, // Максимум 5 незавершенных сессий
    });

    // Для каждой сессии получить последний лог и посчитать текущий счетчик
    const sessionsWithCount = await Promise.all(
      unfinishedSessions.map(async (session) => {
        // Получить все логи сессии для подсчета текущего счетчика
        const logs = await prisma.dhikrLog.findMany({
          where: {
            sessionId: session.id,
          },
          orderBy: {
            atTs: 'asc',
          },
        });

        // Подсчитать текущий счетчик из всех логов
        const currentCount = logs.reduce((sum, log) => {
          if (log.eventType === 'tap' || log.eventType === 'bulk' || log.eventType === 'repeat') {
            return log.valueAfter || sum + log.delta;
          }
          return sum;
        }, 0);

        // Получить информацию о последнем логе (категория, itemId)
        const lastLog = logs[logs.length - 1];
        
        return {
          ...session,
          currentCount,
          category: lastLog?.category,
          itemId: lastLog?.itemId,
          prayerSegment: session.prayerSegment,
        };
      })
    );

    res.json({ sessions: sessionsWithCount });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const apiUserId = getUserIdForApi(req);
      const data = await botReplikaGet<{ session?: unknown }>(`/api/sessions/${req.params.id}`, apiUserId);
      const session = data.session || data;
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json({ session });
    } catch (apiError: any) {
      logger.warn("Bot.e-replika.ru API unavailable, using local DB:", apiError.message);
      const session = await storage.getSession(req.params.id, userId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json({ session });
    }
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const apiUserId = getUserIdForApi(req);
      const data = await botReplikaPost<{ session?: unknown }>("/api/sessions", req.body, apiUserId);
      const session = data.session || data;
      res.status(201).json({ session });
    } catch (apiError: any) {
      logger.warn("Bot.e-replika.ru API unavailable, using local DB:", apiError.message);
      const session = await storage.createSession(userId, req.body);
      res.status(201).json({ session });
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
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const apiUserId = getUserIdForApi(req);
      const data = await botReplikaPatch<{ session?: unknown }>(`/api/sessions/${req.params.id}`, req.body, apiUserId);
      const session = data.session || data;
      res.json({ session });
    } catch (apiError: any) {
      logger.warn("Bot.e-replika.ru API unavailable, using local DB:", apiError.message);
      const session = await storage.updateSession(req.params.id, userId, req.body);
      res.json({ session });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    if (error instanceof Error && error.message === "Session not found") {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
});

export default router;

