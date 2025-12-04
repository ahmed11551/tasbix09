import { Router, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { prisma } from "../db-prisma";
import { z } from "zod";
import { requireAuth, getUserId } from "../middleware/auth";

const router = Router();

// Схемы валидации
const calculateQazaSchema = z.object({
  gender: z.enum(['male', 'female']),
  birthYear: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
  prayerStartYear: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
  haydNifasPeriods: z.array(z.object({
    startDate: z.string(),
    endDate: z.string(),
    type: z.enum(['hayd', 'nifas']),
  })).optional(),
  safarDays: z.array(z.object({
    startDate: z.string(),
    endDate: z.string(),
  })).optional(),
  manualPeriod: z.object({
    years: z.number().int().min(0),
    months: z.number().int().min(0).max(11),
  }).optional(),
});

const updateProgressSchema = z.object({
  prayer: z.enum(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'witr']),
  count: z.number().int().min(0),
});

const markCalendarDaySchema = z.object({
  dateLocal: z.string(), // YYYY-MM-DD
  prayers: z.object({
    fajr: z.boolean().optional(),
    dhuhr: z.boolean().optional(),
    asr: z.boolean().optional(),
    maghrib: z.boolean().optional(),
    isha: z.boolean().optional(),
    witr: z.boolean().optional(),
  }),
});

// Функция расчета долга (ханафитский мазхаб)
function calculateQazaDebt(params: {
  gender: 'male' | 'female';
  birthYear?: number;
  prayerStartYear?: number;
  haydNifasPeriods?: Array<{ startDate: string; endDate: string; type: 'hayd' | 'nifas' }>;
  safarDays?: Array<{ startDate: string; endDate: string }>;
  manualPeriod?: { years: number; months: number };
}): {
  fajr: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
  witr: number;
} {
  let totalDays = 0;

  // Если указан ручной период, используем его
  if (params.manualPeriod) {
    totalDays = params.manualPeriod.years * 365 + params.manualPeriod.months * 30;
  } else if (params.birthYear && params.prayerStartYear) {
    // Автоматический расчет: от рождения до начала намаза (для мужчин)
    // или от начала намаза до текущего времени
    const birthDate = new Date(params.birthYear, 0, 1);
    const startDate = new Date(params.prayerStartYear, 0, 1);
    const now = new Date();
    
    // Для мужчин: период от рождения до начала намаза не считается (до достижения совершеннолетия ~15 лет)
    if (params.gender === 'male') {
      const ageAtStart = startDate.getFullYear() - birthDate.getFullYear();
      if (ageAtStart < 15) {
        // Считать только с совершеннолетия (15 лет) или с начала намаза, что позже
        const maturityDate = new Date(birthDate.getFullYear() + 15, 0, 1);
        const actualStartDate = maturityDate > startDate ? maturityDate : startDate;
        totalDays = Math.floor((now.getTime() - actualStartDate.getTime()) / (1000 * 60 * 60 * 24));
      } else {
        totalDays = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      }
    } else {
      // Для женщин: учитываем периоды хайда/нифаса
      totalDays = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Вычитаем дни хайда/нифаса
      if (params.haydNifasPeriods) {
        params.haydNifasPeriods.forEach(period => {
          const start = new Date(period.startDate);
          const end = new Date(period.endDate);
          const daysExcluded = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          totalDays -= daysExcluded;
        });
      }
    }
    
    // Вычитаем дни сафара (в пути намазы считаются, но могут быть сокращены)
    // Для упрощения не вычитаем, т.к. сокращенные намазы тоже должны быть восполнены
    // Но можем учесть это отдельно при подсчете каждого намаза
  }

  // Базовый расчет: каждый день = 5 обязательных намазов
  // Витр - желательный, но часто включается в расчет
  const baseDebt = {
    fajr: totalDays,
    dhuhr: totalDays,
    asr: totalDays,
    maghrib: totalDays,
    isha: totalDays,
    witr: 0, // Витр обычно не обязателен для восполнения
  };

  // Учет сафара: если были дни в пути, можно учесть особенности
  // В ханафитском мазхабе намазы в пути сокращаются, но должны быть восполнены
  // Для простоты считаем все намазы равнозначно

  return baseDebt;
}

// GET /api/qaza - получить данные о долге
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const qazaDebt = await prisma.qazaDebt.findUnique({
      where: { userId },
    });

    if (!qazaDebt) {
      return res.json({ debt: null });
    }

    res.json({ debt: qazaDebt });
  } catch (error) {
    next(error);
  }
});

// POST /api/qaza/calculate - рассчитать долг
router.post("/calculate", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const parsed = calculateQazaSchema.parse(req.body);
    
    const debt = calculateQazaDebt(parsed);
    
    // Сохранить или обновить расчет
    const qazaDebt = await prisma.qazaDebt.upsert({
      where: { userId },
      create: {
        userId,
        gender: parsed.gender,
        birthYear: parsed.birthYear,
        prayerStartYear: parsed.prayerStartYear,
        haydNifasPeriods: parsed.haydNifasPeriods || [],
        safarDays: parsed.safarDays || [],
        fajrDebt: debt.fajr,
        dhuhrDebt: debt.dhuhr,
        asrDebt: debt.asr,
        maghribDebt: debt.maghrib,
        ishaDebt: debt.isha,
        witrDebt: debt.witr,
      },
      update: {
        gender: parsed.gender,
        birthYear: parsed.birthYear,
        prayerStartYear: parsed.prayerStartYear,
        haydNifasPeriods: parsed.haydNifasPeriods || [],
        safarDays: parsed.safarDays || [],
        fajrDebt: debt.fajr,
        dhuhrDebt: debt.dhuhr,
        asrDebt: debt.asr,
        maghribDebt: debt.maghrib,
        ishaDebt: debt.isha,
        witrDebt: debt.witr,
        calculatedAt: new Date(),
      },
    });

    res.json({ debt: qazaDebt });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    next(error);
  }
});

// PATCH /api/qaza/progress - обновить прогресс восполнения
router.patch("/progress", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const parsed = updateProgressSchema.parse(req.body);
    
    const qazaDebt = await prisma.qazaDebt.findUnique({
      where: { userId },
    });

    if (!qazaDebt) {
      return res.status(404).json({ error: "Qaza debt not found. Please calculate first." });
    }

    const progressFieldMap: Record<string, string> = {
      fajr: 'fajrProgress',
      dhuhr: 'dhuhrProgress',
      asr: 'asrProgress',
      maghrib: 'maghribProgress',
      isha: 'ishaProgress',
      witr: 'witrProgress',
    };
    const progressField = progressFieldMap[parsed.prayer] as keyof typeof qazaDebt;
    const newProgress = parsed.count;

    const updateData: any = {
      [progressField]: newProgress,
    };

    const updated = await prisma.qazaDebt.update({
      where: { userId },
      data: updateData,
    });

    res.json({ debt: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    next(error);
  }
});

// POST /api/qaza/calendar/mark - отметить день в календаре
router.post("/calendar/mark", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const parsed = markCalendarDaySchema.parse(req.body);
    
    // Создать или обновить запись в календаре
    const calendarEntry = await prisma.qazaCalendarEntry.upsert({
      where: {
        userId_dateLocal: {
          userId,
          dateLocal: parsed.dateLocal,
        },
      },
      create: {
        userId,
        dateLocal: parsed.dateLocal,
        fajr: parsed.prayers.fajr || false,
        dhuhr: parsed.prayers.dhuhr || false,
        asr: parsed.prayers.asr || false,
        maghrib: parsed.prayers.maghrib || false,
        isha: parsed.prayers.isha || false,
        witr: parsed.prayers.witr || false,
      },
      update: {
        fajr: parsed.prayers.fajr ?? undefined,
        dhuhr: parsed.prayers.dhuhr ?? undefined,
        asr: parsed.prayers.asr ?? undefined,
        maghrib: parsed.prayers.maghrib ?? undefined,
        isha: parsed.prayers.isha ?? undefined,
        witr: parsed.prayers.witr ?? undefined,
      },
    });

    // Обновить прогресс в QazaDebt на основе календаря
    const allEntries = await prisma.qazaCalendarEntry.findMany({
      where: { userId },
    });

    const progress = {
      fajrProgress: allEntries.filter(e => e.fajr).length,
      dhuhrProgress: allEntries.filter(e => e.dhuhr).length,
      asrProgress: allEntries.filter(e => e.asr).length,
      maghribProgress: allEntries.filter(e => e.maghrib).length,
      ishaProgress: allEntries.filter(e => e.isha).length,
      witrProgress: allEntries.filter(e => e.witr).length,
    };

    await prisma.qazaDebt.update({
      where: { userId },
      data: progress,
    });

    res.json({ entry: calendarEntry, progress });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    next(error);
  }
});

// GET /api/qaza/calendar - получить календарь
router.get("/calendar", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const { startDate, endDate } = req.query;

    const where: any = { userId };
    if (startDate && endDate) {
      where.dateLocal = {
        gte: startDate as string,
        lte: endDate as string,
      };
    }

    const entries = await prisma.qazaCalendarEntry.findMany({
      where,
      orderBy: { dateLocal: 'asc' },
    });

    res.json({ entries });
  } catch (error) {
    next(error);
  }
});

// POST /api/qaza/create-goal - создать цель восполнения
router.post("/create-goal", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const qazaDebt = await prisma.qazaDebt.findUnique({
      where: { userId },
    });

    if (!qazaDebt) {
      return res.status(404).json({ error: "Qaza debt not found. Please calculate first." });
    }

    const totalDebt = qazaDebt.fajrDebt + qazaDebt.dhuhrDebt + qazaDebt.asrDebt + 
                     qazaDebt.maghribDebt + qazaDebt.ishaDebt;
    const totalProgress = qazaDebt.fajrProgress + qazaDebt.dhuhrProgress + qazaDebt.asrProgress +
                         qazaDebt.maghribProgress + qazaDebt.ishaProgress;
    const remaining = totalDebt - totalProgress;

    if (remaining <= 0) {
      return res.status(400).json({ error: "All prayers have been made up" });
    }

    // Создать цель
    const goal = await storage.createGoal(userId, {
      category: 'general',
      goalType: 'recite',
      title: 'Восполнение пропущенных намазов',
      targetCount: remaining,
      currentProgress: totalProgress,
      status: 'active',
      startDate: new Date(),
      endDate: null, // Без срока
    });

    // Обновить QazaDebt с ID цели
    await prisma.qazaDebt.update({
      where: { userId },
      data: { goalId: goal.id },
    });

    res.json({ goal });
  } catch (error) {
    next(error);
  }
});

export default router;

