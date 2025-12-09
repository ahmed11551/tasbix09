import { Router } from "express";
import { storage } from "../storage";
import { requireAuth, getUserId } from "../middleware/auth";
import { prisma } from "../db-prisma";
import { z } from "zod";
import { botReplikaGet, botReplikaPost, botReplikaPatch, botReplikaDelete, getUserIdForApi } from "../lib/bot-replika-api";
import { logger } from "../lib/logger";

const router = Router();
router.use(requireAuth);

// Лимиты активных целей по тарифам
const GOAL_LIMITS = {
  muslim: 3, // Бесплатный тариф: 3 цели
  mutahsin: 20, // PRO тариф: 20 целей
  sahibAlWaqf: 999, // Premium тариф: безлимит (практически)
} as const;

// Функция проверки лимита активных целей
async function checkGoalLimit(userId: string): Promise<{ allowed: boolean; current: number; limit: number; tier: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionTier: true },
  });

  const tier = user?.subscriptionTier || 'muslim';
  const limit = GOAL_LIMITS[tier as keyof typeof GOAL_LIMITS] || GOAL_LIMITS.muslim;

  const activeGoals = await prisma.goal.count({
    where: {
      userId,
      status: 'active',
    },
  });

  return {
    allowed: activeGoals < limit,
    current: activeGoals,
    limit,
    tier,
  };
}

router.get("/", async (req, res, next) => {
  try {
    // Авторизация отключена - всегда используем userId из заголовка или default-user
    const userId = getUserId(req) || (req as any).userId || "default-user";
    
    try {
      const apiUserId = getUserIdForApi(req);
      const data = await botReplikaGet<{ goals?: unknown[] }>("/api/goals", apiUserId);
      res.json({ goals: data.goals || data });
    } catch (apiError: any) {
      logger.warn("Bot.e-replika.ru API unavailable, using local DB:", apiError.message);
      const goals = await storage.getGoals(userId);
      res.json({ goals });
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
      const data = await botReplikaGet<{ goal?: unknown }>(`/api/goals/${req.params.id}`, apiUserId);
      const goal = data.goal || data;
      if (!goal) {
        return res.status(404).json({ error: "Goal not found" });
      }
      res.json({ goal });
    } catch (apiError: any) {
      logger.warn("Bot.e-replika.ru API unavailable, using local DB:", apiError.message);
      const goal = await storage.getGoal(req.params.id, userId);
      if (!goal) {
        return res.status(404).json({ error: "Goal not found" });
      }
      res.json({ goal });
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
      const data = await botReplikaPost<{ goal?: unknown; error?: string }>("/api/goals", req.body, apiUserId);
      
      if (data.error) {
        return res.status(403).json(data);
      }
      
      const goal = data.goal || data;
      res.status(201).json({ goal });
    } catch (apiError: any) {
      // Если ошибка лимита от API, вернуть её
      if (apiError.message?.includes("limit") || apiError.message?.includes("403")) {
        try {
          const errorData = JSON.parse(apiError.message.split(" - ")[1] || "{}");
          if (errorData.error === "Goal limit reached") {
            return res.status(403).json(errorData);
          }
        } catch {}
      }
      
      // Fallback: проверка лимита и создание в локальной БД
      logger.warn("Bot.e-replika.ru API unavailable, using local DB:", apiError.message);
      
      // Убедиться, что пользователь существует в БД
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        // Создать пользователя если его нет
        await prisma.user.create({
          data: {
            id: userId,
            username: userId === "default-user" ? `default-user-${Date.now()}` : userId,
            password: await storage.hashPassword("default-password"),
          },
        });
      }
      
      const limitCheck = await checkGoalLimit(userId);
      // В Docker всегда разрешаем обходить лимит для тестирования (можно отключить через ENFORCE_GOAL_LIMIT=true)
      const shouldEnforceLimit = process.env.ENFORCE_GOAL_LIMIT === 'true';
      
      if (!limitCheck.allowed && shouldEnforceLimit) {
        return res.status(403).json({
          error: "Goal limit reached",
          message: `Вы достигли лимита активных целей (${limitCheck.current}/${limitCheck.limit}) для тарифа "${limitCheck.tier}". Перейдите на более высокий тариф, чтобы создавать больше целей.`,
          current: limitCheck.current,
          limit: limitCheck.limit,
          tier: limitCheck.tier,
          upgradeRequired: true,
        });
      }
      
      if (!limitCheck.allowed && !shouldEnforceLimit) {
        // Предупреждаем, но разрешаем создать для тестирования
        logger.warn(`Goal limit exceeded (allowed for testing): ${limitCheck.current}/${limitCheck.limit} for user ${userId}`);
      }
      const goal = await storage.createGoal(userId, req.body);
      res.status(201).json({ goal });
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
      const data = await botReplikaPatch<{ goal?: unknown; error?: string }>(`/api/goals/${req.params.id}`, req.body, apiUserId);
      
      if (data.error) {
        return res.status(403).json(data);
      }
      
      const goal = data.goal || data;
      res.json({ goal });
    } catch (apiError: any) {
      if (apiError.message?.includes("limit") || apiError.message?.includes("403")) {
        try {
          const errorData = JSON.parse(apiError.message.split(" - ")[1] || "{}");
          if (errorData.error === "Goal limit reached") {
            return res.status(403).json(errorData);
          }
        } catch {}
      }
      
      logger.warn("Bot.e-replika.ru API unavailable, using local DB:", apiError.message);
      const parsed = req.body;
      if (parsed.status === 'active') {
        const existingGoal = await storage.getGoal(req.params.id, userId);
        if (existingGoal && existingGoal.status !== 'active') {
          const limitCheck = await checkGoalLimit(userId);
          if (!limitCheck.allowed) {
            return res.status(403).json({
              error: "Goal limit reached",
              message: `Вы достигли лимита активных целей (${limitCheck.current}/${limitCheck.limit}) для тарифа "${limitCheck.tier}". Перейдите на более высокий тариф, чтобы активировать больше целей.`,
              current: limitCheck.current,
              limit: limitCheck.limit,
              tier: limitCheck.tier,
              upgradeRequired: true,
            });
          }
        }
      }
      const goal = await storage.updateGoal(req.params.id, userId, parsed);
      res.json({ goal });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    if (error instanceof Error && error.message === "Goal not found") {
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
      await botReplikaDelete(`/api/goals/${req.params.id}`, apiUserId);
      res.json({ message: "Goal deleted successfully" });
    } catch (apiError: any) {
      logger.warn("Bot.e-replika.ru API unavailable, using local DB:", apiError.message);
      await storage.deleteGoal(req.params.id, userId);
      res.json({ message: "Goal deleted successfully" });
    }
  } catch (error) {
    next(error);
  }
});

export default router;

