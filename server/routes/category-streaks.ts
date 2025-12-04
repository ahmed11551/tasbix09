import { Router } from "express";
import { storage } from "../storage";
import { prisma } from "../db-prisma";
import { requireAuth, getUserId } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

// Функция расчета streak для категории на основе данных за последние дни
async function calculateCategoryStreak(
  userId: string,
  category: 'prayer' | 'quran' | 'dhikr',
  activityDates: string[] // массив дат в формате 'YYYY-MM-DD', отсортированный по убыванию
): Promise<{ currentStreak: number; longestStreak: number }> {
  if (activityDates.length === 0) {
    // Получить существующий streak или вернуть 0
    const existing = await storage.getCategoryStreak(userId, category);
    return {
      currentStreak: existing?.currentStreak || 0,
      longestStreak: existing?.longestStreak || 0,
    };
  }

  // Подсчет текущего streak (consecutive days до сегодня включительно)
  let currentStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sortedDates = [...new Set(activityDates)].sort().reverse(); // Уникальные даты, отсортированные по убыванию
  
  // Проверить, есть ли активность сегодня или вчера
  const todayStr = today.toISOString().split('T')[0];
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  // Если нет активности сегодня или вчера, streak прерван
  if (!sortedDates.includes(todayStr) && !sortedDates.includes(yesterdayStr)) {
    const existing = await storage.getCategoryStreak(userId, category);
    return {
      currentStreak: 0,
      longestStreak: existing?.longestStreak || 0,
    };
  }

  // Подсчитать consecutive days от сегодня
  const checkDate = sortedDates.includes(todayStr) ? today : yesterday;
  let streak = 0;
  let checkDateCopy = new Date(checkDate);
  
  while (true) {
    const checkDateStr = checkDateCopy.toISOString().split('T')[0];
    if (sortedDates.includes(checkDateStr)) {
      streak++;
      checkDateCopy.setDate(checkDateCopy.getDate() - 1);
    } else {
      break;
    }
  }

  // Подсчет longest streak
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate: Date | null = null;

  for (const dateStr of sortedDates) {
    const date = new Date(dateStr + 'T00:00:00');
    if (prevDate === null) {
      tempStreak = 1;
      longestStreak = 1;
    } else {
      const diffDays = Math.floor((prevDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }
    prevDate = date;
  }

  // Получить существующий longest streak и сравнить
  const existing = await storage.getCategoryStreak(userId, category);
  const finalLongestStreak = Math.max(longestStreak, existing?.longestStreak || 0);

  return {
    currentStreak: streak,
    longestStreak: finalLongestStreak,
  };
}

// Функция обновления streak для категории на основе текущей активности
async function updateCategoryStreaks(userId: string) {
  try {
    // Получить данные для расчета streaks
    
    // 1. Prayer streak - на основе DailyAzkar (если были намазы в день)
    const dailyAzkarEntries = await prisma.dailyAzkar.findMany({
      where: { userId },
      orderBy: { dateLocal: 'desc' },
    });
    const prayerDates = dailyAzkarEntries
      .filter(entry => {
        // Проверить, были ли намазы в этот день
        const total = entry.fajr + entry.dhuhr + entry.asr + entry.maghrib + entry.isha;
        return total > 0;
      })
      .map(entry => entry.dateLocal);
    
    const prayerStreak = await calculateCategoryStreak(userId, 'prayer', prayerDates);
    await storage.updateCategoryStreak(userId, 'prayer', {
      ...prayerStreak,
      lastActivityDate: prayerDates.length > 0 ? new Date(prayerDates[0] + 'T00:00:00') : null,
    });

    // 2. Quran streak - на основе целей с категорией 'surah' или 'ayah' (коран)
    const goals = await storage.getGoals(userId);
    const quranGoals = goals.filter(g => g.category === 'surah' || g.category === 'ayah');
    const quranDates: string[] = [];
    
    // Получить даты активности по корану (когда была активность по целям корана)
    for (const goal of quranGoals) {
      // Получить логи dhikr для этой цели
      const logs = await prisma.dhikrLog.findMany({
        where: {
          userId,
          goalId: goal.id,
        },
      });
      
      const goalDates = logs.map(log => {
        const date = new Date(log.atTs);
        date.setHours(0, 0, 0, 0);
        return date.toISOString().split('T')[0];
      });
      
      quranDates.push(...goalDates);
    }
    
    const uniqueQuranDates = [...new Set(quranDates)];
    const quranStreak = await calculateCategoryStreak(userId, 'quran', uniqueQuranDates);
    await storage.updateCategoryStreak(userId, 'quran', {
      ...quranStreak,
      lastActivityDate: uniqueQuranDates.length > 0 ? new Date(uniqueQuranDates[0] + 'T00:00:00') : null,
    });

    // 3. Dhikr streak - на основе всех логов dhikr (кроме корана)
    const allLogs = await storage.getDhikrLogs(userId, 100000);
    const dhikrDates = allLogs
      .filter(log => {
        // Исключить коран (surah и ayah)
        if (log.category === 'surah' || log.category === 'ayah') return false;
        // Включить только tap/bulk/repeat события
        return log.eventType === 'tap' || log.eventType === 'bulk' || log.eventType === 'repeat';
      })
      .map(log => {
        const date = new Date(log.atTs);
        date.setHours(0, 0, 0, 0);
        return date.toISOString().split('T')[0];
      });
    
    const uniqueDhikrDates = [...new Set(dhikrDates)];
    const dhikrStreak = await calculateCategoryStreak(userId, 'dhikr', uniqueDhikrDates);
    await storage.updateCategoryStreak(userId, 'dhikr', {
      ...dhikrStreak,
      lastActivityDate: uniqueDhikrDates.length > 0 ? new Date(uniqueDhikrDates[0] + 'T00:00:00') : null,
    });

    return {
      prayer: prayerStreak,
      quran: quranStreak,
      dhikr: dhikrStreak,
    };
  } catch (error) {
    console.error('Error updating category streaks:', error);
    throw error;
  }
}

// GET /api/category-streaks - получить все категорийные streaks
router.get("/", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    // Обновить streaks перед возвратом
    await updateCategoryStreaks(userId);
    
    const streaks = await storage.getCategoryStreaks(userId);
    res.json({ streaks });
  } catch (error) {
    next(error);
  }
});

// POST /api/category-streaks/update - обновить streaks (можно вызвать вручную)
router.post("/update", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const updated = await updateCategoryStreaks(userId);
    res.json({ success: true, streaks: updated });
  } catch (error) {
    next(error);
  }
});

// GET /api/category-streaks/:category - получить streak конкретной категории
router.get("/:category", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const category = req.params.category;
    
    if (!['prayer', 'quran', 'dhikr'].includes(category)) {
      return res.status(400).json({ error: "Invalid category. Must be 'prayer', 'quran', or 'dhikr'" });
    }
    
    // Обновить streaks перед возвратом
    await updateCategoryStreaks(userId);
    
    const streak = await storage.getCategoryStreak(userId, category);
    if (!streak) {
      return res.status(404).json({ error: "Streak not found" });
    }
    res.json({ streak });
  } catch (error) {
    next(error);
  }
});

export default router;
export { updateCategoryStreaks };

