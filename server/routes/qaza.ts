import { Router, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { prisma } from "../db-prisma";
import { z } from "zod";
import { requireAuth, getUserId } from "../middleware/auth";
import { botReplikaGet, botReplikaPost, botReplikaPatch, getUserIdForApi } from "../lib/bot-replika-api";
import { logger } from "../lib/logger";

const router = Router();

// Словарик терминов для Каза
const QAZA_TERMS = [
  {
    term: "Каза",
    definition: "Восполнение пропущенного намаза. Если мусульманин пропустил обязательный намаз, он должен восполнить его позже.",
    example: "Если вы пропустили утренний намаз, его нужно восполнить в течение дня."
  },
  {
    term: "Булюг",
    definition: "Совершеннолетие в исламе. С этого возраста человек обязан выполнять все религиозные обязательства, включая намаз.",
    example: "В ханафитском мазхабе совершеннолетие наступает в 15 лет (по хиджре)."
  },
  {
    term: "Хайд",
    definition: "Менструация у женщин. В этот период женщина освобождается от обязательных намазов и поста.",
    example: "Дни хайда не засчитываются в расчет пропущенных намазов."
  },
  {
    term: "Нифас",
    definition: "Послеродовое кровотечение. Период после родов, когда женщина освобождается от намазов и поста.",
    example: "Нифас обычно длится 40 дней, но может быть меньше."
  },
  {
    term: "Сафар",
    definition: "Путешествие. Во время путешествия (при определенных условиях) намазы могут быть сокращены.",
    example: "В пути намазы Зухр, Аср и Иша сокращаются с 4 ракаатов до 2."
  },
  {
    term: "Мазхаб",
    definition: "Школа исламского права. Разные мазхабы могут иметь различные мнения по некоторым вопросам.",
    example: "В ханафитском мазхабе витр обязателен, в шафиитском - желателен."
  },
  {
    term: "Витр",
    definition: "Нечетный намаз, совершаемый после ночного намаза (Иша).",
    example: "В ханафитском мазхабе витр считается обязательным намазом."
  }
];

// Схемы валидации
const calculateQazaSchema = z.object({
  gender: z.enum(['male', 'female']),
  birthDate: z.string().optional(), // Полная дата рождения YYYY-MM-DD
  birthYear: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
  bulughAge: z.number().int().min(10).max(20).optional(), // Возраст совершеннолетия (по умолчанию 15)
  prayerStartDate: z.string().optional(), // Дата начала намаза YYYY-MM-DD
  prayerStartYear: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
  todayAsStart: z.boolean().optional(), // С сегодняшнего дня
  madhab: z.enum(['hanafi', 'shafii', 'maliki', 'hanbali']).optional().default('hanafi'),
  // Данные для женщин
  haidDaysPerMonth: z.number().int().min(0).max(15).optional(), // Дней хайда в месяц (по умолчанию 7)
  childbirthCount: z.number().int().min(0).optional(), // Количество родов
  nifasDaysPerChildbirth: z.number().int().min(0).max(60).optional(), // Дней нифаса на роды (по умолчанию 40)
  haydNifasPeriods: z.array(z.object({
    startDate: z.string(),
    endDate: z.string(),
    type: z.enum(['hayd', 'nifas']),
  })).optional(),
  // Данные сафара
  totalTravelDays: z.number().int().min(0).optional(),
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

// GET /api/qaza/terms - словарик терминов
router.get("/terms", async (req, res, next) => {
  try {
    try {
      const apiUserId = getUserIdForApi(req);
      const data = await botReplikaGet<{ terms?: unknown[] }>("/api/qaza/terms", apiUserId);
      res.json({ terms: data.terms || data });
    } catch (apiError: any) {
      logger.warn("Bot.e-replika.ru API unavailable, using local terms:", apiError.message);
      res.json({ terms: QAZA_TERMS });
    }
  } catch (error) {
    next(error);
  }
});

// Функция расчета даты булюга (упрощенная версия, без хиджры пока)
function calculateBulughDate(birthDate: Date, customBulughAge: number = 15): Date {
  const bulughDate = new Date(birthDate);
  bulughDate.setFullYear(bulughDate.getFullYear() + customBulughAge);
  return bulughDate;
}

// Функция расчета долга (ханафитский мазхаб)
function calculateQazaDebt(params: {
  gender: 'male' | 'female';
  birthDate?: string;
  birthYear?: number;
  bulughAge?: number;
  prayerStartDate?: string;
  prayerStartYear?: number;
  todayAsStart?: boolean;
  madhab?: 'hanafi' | 'shafii' | 'maliki' | 'hanbali';
  haidDaysPerMonth?: number;
  childbirthCount?: number;
  nifasDaysPerChildbirth?: number;
  haydNifasPeriods?: Array<{ startDate: string; endDate: string; type: 'hayd' | 'nifas' }>;
  totalTravelDays?: number;
  safarDays?: Array<{ startDate: string; endDate: string }>;
  manualPeriod?: { years: number; months: number };
}): {
  fajr: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
  witr: number;
  dhuhrSafar?: number;
  asrSafar?: number;
  ishaSafar?: number;
  effectiveDays: number;
  excludedDays: number;
} {
  let totalDays = 0;
  let excludedDays = 0;
  const bulughAge = params.bulughAge || 15;
  const madhab = params.madhab || 'hanafi';

  // Если указан ручной период, используем его
  if (params.manualPeriod) {
    totalDays = params.manualPeriod.years * 365 + params.manualPeriod.months * 30;
  } else {
    // Определяем дату начала расчета
    let startDate: Date;
    
    if (params.birthDate) {
      const birth = new Date(params.birthDate);
      startDate = calculateBulughDate(birth, bulughAge);
    } else if (params.birthYear) {
      const birth = new Date(params.birthYear, 0, 1);
      startDate = calculateBulughDate(birth, bulughAge);
    } else {
      throw new Error("Необходимо указать дату рождения");
    }

    // Определяем дату окончания
    const endDate = params.todayAsStart 
      ? new Date() 
      : (params.prayerStartDate 
        ? new Date(params.prayerStartDate) 
        : (params.prayerStartYear 
          ? new Date(params.prayerStartYear, 0, 1) 
          : new Date()));

    totalDays = Math.max(0, Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

    // Для женщин: учитываем автоматический расчет хайда/нифаса
    if (params.gender === 'female') {
      const totalMonths = totalDays / 30.44;
      const haidDaysPerMonth = params.haidDaysPerMonth || 7;
      const haidDays = Math.floor(totalMonths * haidDaysPerMonth);
      
      const childbirthCount = params.childbirthCount || 0;
      const nifasDaysPerChildbirth = params.nifasDaysPerChildbirth || 40;
      const nifasDays = childbirthCount * nifasDaysPerChildbirth;
      
      excludedDays += haidDays + nifasDays;

      // Также учитываем указанные периоды
      if (params.haydNifasPeriods) {
        params.haydNifasPeriods.forEach(period => {
          const start = new Date(period.startDate);
          const end = new Date(period.endDate);
          const daysExcluded = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          excludedDays += daysExcluded;
        });
      }
    }

    // Учитываем сафар
    if (params.totalTravelDays) {
      excludedDays += params.totalTravelDays;
    }
    if (params.safarDays) {
      params.safarDays.forEach(period => {
        const start = new Date(period.startDate);
        const end = new Date(period.endDate);
        const daysExcluded = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        excludedDays += daysExcluded;
      });
    }
  }

  const effectiveDays = Math.max(0, totalDays - excludedDays);

  // Базовый расчет: каждый день = 5 обязательных намазов
  const baseDebt = {
    fajr: effectiveDays,
    dhuhr: effectiveDays,
    asr: effectiveDays,
    maghrib: effectiveDays,
    isha: effectiveDays,
    witr: madhab === 'hanafi' ? effectiveDays : 0, // В ханафитском витр обязателен
    effectiveDays,
    excludedDays,
  };

  // Сафар-намазы (сокращенные)
  const travelDays = params.totalTravelDays || (params.safarDays 
    ? params.safarDays.reduce((sum, period) => {
        const start = new Date(period.startDate);
        const end = new Date(period.endDate);
        return sum + Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      }, 0)
    : 0);

  return {
    ...baseDebt,
    dhuhrSafar: travelDays,
    asrSafar: travelDays,
    ishaSafar: travelDays,
  };
}

// GET /api/qaza - получить данные о долге
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const apiUserId = getUserIdForApi(req);
      const data = await botReplikaGet<{ debt?: unknown }>("/api/qaza", apiUserId);
      res.json({ debt: data.debt || data });
    } catch (apiError: any) {
      logger.warn("Bot.e-replika.ru API unavailable, using local DB:", apiError.message);
      
      const qazaDebt = await prisma.qazaDebt.findUnique({
        where: { userId },
      });

      if (!qazaDebt) {
        return res.json({ debt: null });
      }

      res.json({ debt: qazaDebt });
    }
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
    
    try {
      const apiUserId = getUserIdForApi(req);
      const data = await botReplikaPost<{ debt?: unknown }>("/api/qaza/calculate", parsed, apiUserId);
      res.json({ debt: data.debt || data });
    } catch (apiError: any) {
      logger.warn("Bot.e-replika.ru API unavailable, using local DB:", apiError.message);
      
      // Fallback: расчет на локальной БД
      const debt = calculateQazaDebt(parsed);
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
      res.json({ debt: qazaDebt, calculation: { effectiveDays: debt.effectiveDays, excludedDays: debt.excludedDays } });
    }
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
    
    try {
      const apiUserId = getUserIdForApi(req);
      const data = await botReplikaPatch<{ debt?: unknown }>("/api/qaza/progress", parsed, apiUserId);
      res.json({ debt: data.debt || data });
    } catch (apiError: any) {
      logger.warn("Bot.e-replika.ru API unavailable, using local DB:", apiError.message);
      
      // Fallback на локальную БД
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
    }
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
    
    try {
      const apiUserId = getUserIdForApi(req);
      const data = await botReplikaPost<{ entry?: unknown; progress?: unknown }>("/api/qaza/calendar/mark", parsed, apiUserId);
      res.json({ 
        entry: data.entry || data,
        progress: data.progress || {}
      });
    } catch (apiError: any) {
      logger.warn("Bot.e-replika.ru API unavailable, using local DB:", apiError.message);
      
      // Fallback: создать или обновить запись в календаре
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
    }
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
    
    try {
      const apiUserId = getUserIdForApi(req);
      const { startDate, endDate } = req.query;
      const query = startDate && endDate ? `?startDate=${startDate}&endDate=${endDate}` : '';
      const data = await botReplikaGet<{ entries?: unknown[] }>(`/api/qaza/calendar${query}`, apiUserId);
      res.json({ entries: data.entries || data });
    } catch (apiError: any) {
      logger.warn("Bot.e-replika.ru API unavailable, using local DB:", apiError.message);
      
      // Fallback на локальную БД
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
    }
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
    
    try {
      const apiUserId = getUserIdForApi(req);
      const data = await botReplikaPost<{ goal?: unknown }>("/api/qaza/create-goal", {}, apiUserId);
      res.json({ goal: data.goal || data });
    } catch (apiError: any) {
      logger.warn("Bot.e-replika.ru API unavailable, using local DB:", apiError.message);
      
      // Fallback на локальную БД
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
      } as any); // user будет добавлен автоматически через connect в storage.createGoal

      // Обновить QazaDebt с ID цели
      await prisma.qazaDebt.update({
        where: { userId },
        data: { goalId: goal.id },
      });

      res.json({ goal });
    }
  } catch (error) {
    next(error);
  }
});

export default router;
