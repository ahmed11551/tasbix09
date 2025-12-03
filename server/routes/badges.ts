import { Router } from "express";
import { storage } from "../storage";
import { prisma } from "../db-prisma";
import { requireAuth, getUserId } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

// Определения бейджей
const BADGE_DEFINITIONS = {
  // Streaks
  streak_7: { type: 'streak_7', title: 'Неделя подряд', description: '7 дней подряд активность', level: 'copper' as const, icon: '🔥', target: 7 },
  streak_30: { type: 'streak_30', title: 'Месяц подряд', description: '30 дней подряд активность', level: 'silver' as const, icon: '🔥', target: 30 },
  streak_100: { type: 'streak_100', title: 'Сотня дней', description: '100 дней подряд активность', level: 'gold' as const, icon: '🔥', target: 100 },
  
  // Goals
  first_goal: { type: 'first_goal', title: 'Первая цель', description: 'Создал первую цель', level: 'copper' as const, icon: '🎯', target: 1 },
  goal_master: { type: 'goal_master', title: 'Мастер целей', description: 'Выполнил 10 целей', level: 'silver' as const, icon: '🎯', target: 10 },
  goal_champion: { type: 'goal_champion', title: 'Чемпион целей', description: 'Выполнил 50 целей', level: 'gold' as const, icon: '🎯', target: 50 },
  
  // Dhikr
  dhikr_1000: { type: 'dhikr_1000', title: 'Тысяча зикров', description: 'Произнес 1000 зикров', level: 'copper' as const, icon: '✨', target: 1000 },
  dhikr_10000: { type: 'dhikr_10000', title: 'Десять тысяч зикров', description: 'Произнес 10000 зикров', level: 'silver' as const, icon: '✨', target: 10000 },
  dhikr_100000: { type: 'dhikr_100000', title: 'Сто тысяч зикров', description: 'Произнес 100000 зикров', level: 'gold' as const, icon: '✨', target: 100000 },
  
  // Prayer (Namaz/Qaza)
  prayer_consistent: { type: 'prayer_consistent', title: 'Постоянство в молитве', description: '30 дней подряд совершал намаз', level: 'copper' as const, icon: '🕌', target: 30 },
  qaza_completed: { type: 'qaza_completed', title: 'Восполнил долг', description: 'Восполнил все пропущенные намазы', level: 'gold' as const, icon: '🕌', target: 1 },
  
  // Quran
  quran_reader: { type: 'quran_reader', title: 'Чтец Корана', description: 'Прочитал 30 джузов', level: 'copper' as const, icon: '📖', target: 30 },
  quran_master: { type: 'quran_master', title: 'Мастер Корана', description: 'Прочитал весь Коран', level: 'gold' as const, icon: '📖', target: 114 }, // 114 сур
};

// Функция проверки и присвоения бейджей
export async function checkAndAwardBadges(userId: string) {
  const newBadges: any[] = [];
  
  try {
    // Получить статистику пользователя
    const [habits, goals, logs] = await Promise.all([
      storage.getHabits(userId),
      storage.getGoals(userId),
      storage.getDhikrLogs(userId, 100000),
    ]);

    // Получить существующие бейджи
    const existingBadges = await storage.getBadges(userId);
    const existingBadgeTypes = new Set(existingBadges.map(b => b.type));

    // Подсчет статистики
    const totalDhikrCount = logs.reduce((sum, log) => {
      if (log.eventType === 'tap' || log.eventType === 'bulk' || log.eventType === 'repeat') {
        return sum + log.delta;
      }
      return sum;
    }, 0);

    const completedGoals = goals.filter(g => g.status === 'completed').length;
    const maxStreak = habits.length > 0 ? Math.max(...habits.map(h => h.currentStreak || 0), 0) : 0;

    // Проверка бейджей на streaks
    if (maxStreak >= 7 && !existingBadgeTypes.has('streak_7')) {
      const badge = await storage.createBadge(userId, {
        type: 'streak_7',
        title: BADGE_DEFINITIONS.streak_7.title,
        description: BADGE_DEFINITIONS.streak_7.description,
        level: BADGE_DEFINITIONS.streak_7.level,
        icon: BADGE_DEFINITIONS.streak_7.icon,
        isUnlocked: true,
        achievedAt: new Date(),
        progress: maxStreak,
        target: BADGE_DEFINITIONS.streak_7.target,
      });
      newBadges.push(badge);
    }

    if (maxStreak >= 30 && !existingBadgeTypes.has('streak_30')) {
      const badge = await storage.createBadge(userId, {
        type: 'streak_30',
        title: BADGE_DEFINITIONS.streak_30.title,
        description: BADGE_DEFINITIONS.streak_30.description,
        level: BADGE_DEFINITIONS.streak_30.level,
        icon: BADGE_DEFINITIONS.streak_30.icon,
        isUnlocked: true,
        achievedAt: new Date(),
        progress: maxStreak,
        target: BADGE_DEFINITIONS.streak_30.target,
      });
      newBadges.push(badge);
    }

    if (maxStreak >= 100 && !existingBadgeTypes.has('streak_100')) {
      const badge = await storage.createBadge(userId, {
        type: 'streak_100',
        title: BADGE_DEFINITIONS.streak_100.title,
        description: BADGE_DEFINITIONS.streak_100.description,
        level: BADGE_DEFINITIONS.streak_100.level,
        icon: BADGE_DEFINITIONS.streak_100.icon,
        isUnlocked: true,
        achievedAt: new Date(),
        progress: maxStreak,
        target: BADGE_DEFINITIONS.streak_100.target,
      });
      newBadges.push(badge);
    }

    // Проверка бейджей на цели
    if (completedGoals >= 1 && !existingBadgeTypes.has('first_goal')) {
      const badge = await storage.createBadge(userId, {
        type: 'first_goal',
        title: BADGE_DEFINITIONS.first_goal.title,
        description: BADGE_DEFINITIONS.first_goal.description,
        level: BADGE_DEFINITIONS.first_goal.level,
        icon: BADGE_DEFINITIONS.first_goal.icon,
        isUnlocked: true,
        achievedAt: new Date(),
        progress: completedGoals,
        target: BADGE_DEFINITIONS.first_goal.target,
      });
      newBadges.push(badge);
    }

    if (completedGoals >= 10 && !existingBadgeTypes.has('goal_master')) {
      const badge = await storage.createBadge(userId, {
        type: 'goal_master',
        title: BADGE_DEFINITIONS.goal_master.title,
        description: BADGE_DEFINITIONS.goal_master.description,
        level: BADGE_DEFINITIONS.goal_master.level,
        icon: BADGE_DEFINITIONS.goal_master.icon,
        isUnlocked: true,
        achievedAt: new Date(),
        progress: completedGoals,
        target: BADGE_DEFINITIONS.goal_master.target,
      });
      newBadges.push(badge);
    }

    if (completedGoals >= 50 && !existingBadgeTypes.has('goal_champion')) {
      const badge = await storage.createBadge(userId, {
        type: 'goal_champion',
        title: BADGE_DEFINITIONS.goal_champion.title,
        description: BADGE_DEFINITIONS.goal_champion.description,
        level: BADGE_DEFINITIONS.goal_champion.level,
        icon: BADGE_DEFINITIONS.goal_champion.icon,
        isUnlocked: true,
        achievedAt: new Date(),
        progress: completedGoals,
        target: BADGE_DEFINITIONS.goal_champion.target,
      });
      newBadges.push(badge);
    }

    // Проверка бейджей на зикры
    if (totalDhikrCount >= 1000 && !existingBadgeTypes.has('dhikr_1000')) {
      const badge = await storage.createBadge(userId, {
        type: 'dhikr_1000',
        title: BADGE_DEFINITIONS.dhikr_1000.title,
        description: BADGE_DEFINITIONS.dhikr_1000.description,
        level: BADGE_DEFINITIONS.dhikr_1000.level,
        icon: BADGE_DEFINITIONS.dhikr_1000.icon,
        isUnlocked: true,
        achievedAt: new Date(),
        progress: totalDhikrCount,
        target: BADGE_DEFINITIONS.dhikr_1000.target,
      });
      newBadges.push(badge);
    }

    if (totalDhikrCount >= 10000 && !existingBadgeTypes.has('dhikr_10000')) {
      const badge = await storage.createBadge(userId, {
        type: 'dhikr_10000',
        title: BADGE_DEFINITIONS.dhikr_10000.title,
        description: BADGE_DEFINITIONS.dhikr_10000.description,
        level: BADGE_DEFINITIONS.dhikr_10000.level,
        icon: BADGE_DEFINITIONS.dhikr_10000.icon,
        isUnlocked: true,
        achievedAt: new Date(),
        progress: totalDhikrCount,
        target: BADGE_DEFINITIONS.dhikr_10000.target,
      });
      newBadges.push(badge);
    }

    if (totalDhikrCount >= 100000 && !existingBadgeTypes.has('dhikr_100000')) {
      const badge = await storage.createBadge(userId, {
        type: 'dhikr_100000',
        title: BADGE_DEFINITIONS.dhikr_100000.title,
        description: BADGE_DEFINITIONS.dhikr_100000.description,
        level: BADGE_DEFINITIONS.dhikr_100000.level,
        icon: BADGE_DEFINITIONS.dhikr_100000.icon,
        isUnlocked: true,
        achievedAt: new Date(),
        progress: totalDhikrCount,
        target: BADGE_DEFINITIONS.dhikr_100000.target,
      });
      newBadges.push(badge);
    }

    // Проверка бейджа на завершение Каза
    const qazaDebt = await prisma.qazaDebt.findUnique({
      where: { userId },
    });

    if (qazaDebt && !existingBadgeTypes.has('qaza_completed')) {
      const totalDebt = qazaDebt.fajrDebt + qazaDebt.dhuhrDebt + qazaDebt.asrDebt + 
                       qazaDebt.maghribDebt + qazaDebt.ishaDebt;
      const totalProgress = qazaDebt.fajrProgress + qazaDebt.dhuhrProgress + qazaDebt.asrProgress +
                           qazaDebt.maghribProgress + qazaDebt.ishaProgress;
      
      if (totalProgress >= totalDebt && totalDebt > 0) {
        const badge = await storage.createBadge(userId, {
          type: 'qaza_completed',
          title: BADGE_DEFINITIONS.qaza_completed.title,
          description: BADGE_DEFINITIONS.qaza_completed.description,
          level: BADGE_DEFINITIONS.qaza_completed.level,
          icon: BADGE_DEFINITIONS.qaza_completed.icon,
          isUnlocked: true,
          achievedAt: new Date(),
          progress: 1,
          target: BADGE_DEFINITIONS.qaza_completed.target,
        });
        newBadges.push(badge);
      }
    }

    // Обновить прогресс для незаблокированных бейджей
    for (const badge of existingBadges) {
      if (!badge.isUnlocked && badge.target) {
        let currentProgress = 0;

        if (badge.type.startsWith('streak_')) {
          currentProgress = maxStreak;
        } else if (badge.type.startsWith('goal_')) {
          currentProgress = completedGoals;
        } else if (badge.type.startsWith('dhikr_')) {
          currentProgress = totalDhikrCount;
        }

        if (currentProgress >= badge.target) {
          await storage.updateBadge(badge.id, userId, {
            isUnlocked: true,
            achievedAt: new Date(),
            progress: currentProgress,
          });
          newBadges.push({ ...badge, isUnlocked: true, achievedAt: new Date(), progress: currentProgress });
        } else if (currentProgress !== badge.progress) {
          await storage.updateBadge(badge.id, userId, {
            progress: currentProgress,
          });
        }
      }
    }

    return newBadges;
  } catch (error) {
    console.error('Error checking badges:', error);
    return [];
  }
}

// GET /api/badges - получить все бейджи пользователя
router.get("/", async (req, res, next) => {
  try {
    const userId = getUserId(req)!;
    const badges = await storage.getBadges(userId);
    
    // Проверить и присвоить новые бейджи
    const newBadges = await checkAndAwardBadges(userId);
    
    // Если есть новые бейджи, обновить список
    if (newBadges.length > 0) {
      const updatedBadges = await storage.getBadges(userId);
      return res.json({ badges: updatedBadges, newBadges });
    }

    res.json({ badges });
  } catch (error) {
    next(error);
  }
});

// GET /api/badges/check - проверить и присвоить бейджи (без обновления списка)
router.post("/check", async (req, res, next) => {
  try {
    const userId = getUserId(req)!;
    const newBadges = await checkAndAwardBadges(userId);
    res.json({ newBadges });
  } catch (error) {
    next(error);
  }
});

// GET /api/badges/:id - получить конкретный бейдж
router.get("/:id", async (req, res, next) => {
  try {
    const userId = getUserId(req)!;
    const badge = await storage.getBadge(req.params.id, userId);
    if (!badge) {
      return res.status(404).json({ error: "Badge not found" });
    }
    res.json({ badge });
  } catch (error) {
    next(error);
  }
});

export default router;
export { checkAndAwardBadges };

