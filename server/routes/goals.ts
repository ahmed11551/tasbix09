import { Router } from "express";
import { storage } from "../storage";
import { requireAuth, getUserId } from "../middleware/auth";
import { prisma } from "../db-prisma";
import { z } from "zod";

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
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const goals = await storage.getGoals(userId);
    res.json({ goals });
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
    const goal = await storage.getGoal(req.params.id, userId);
    if (!goal) {
      return res.status(404).json({ error: "Goal not found" });
    }
    res.json({ goal });
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
    
    // Проверка лимита активных целей
    const limitCheck = await checkGoalLimit(userId);
    if (!limitCheck.allowed) {
      return res.status(403).json({
        error: "Goal limit reached",
        message: `Вы достигли лимита активных целей (${limitCheck.current}/${limitCheck.limit}) для тарифа "${limitCheck.tier}". Перейдите на более высокий тариф, чтобы создавать больше целей.`,
        current: limitCheck.current,
        limit: limitCheck.limit,
        tier: limitCheck.tier,
        upgradeRequired: true,
      });
    }

    const parsed = req.body;
    const goal = await storage.createGoal(userId, parsed);
    res.status(201).json({ goal });
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
    const parsed = req.body;
    
    // Если статус меняется на 'active', проверяем лимит
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
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    await storage.deleteGoal(req.params.id, userId);
    res.json({ message: "Goal deleted successfully" });
  } catch (error) {
    next(error);
  }
});

export default router;

