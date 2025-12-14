import { Router } from "express";
import { storage } from "../storage";
import { requireAuth, getUserId } from "../middleware/auth";
import { z } from "zod";
import { botReplikaGet, botReplikaPost, getUserIdForApi } from "../lib/bot-replika-api";
import { logger } from "../lib/logger";
import { prisma } from "../db-prisma";
import { updateGroupGoalsProgress } from "../lib/group-goal-sync";
import { getUserFriendlyErrorMessage, formatZodError } from "../lib/user-friendly-errors";

const router = Router();
router.use(requireAuth);

// Zod схемы для валидации
const createDhikrLogSchema = z.object({
  sessionId: z.string().uuid().optional(),
  goalId: z.string().uuid().optional().nullable(),
  category: z.enum(['general', 'surah', 'ayah', 'dua', 'azkar', 'names99', 'salawat', 'kalimat']),
  itemId: z.string().optional().nullable(),
  eventType: z.enum(['tap', 'bulk', 'repeat', 'learn_mark', 'goal_completed', 'auto_reset']),
  delta: z.number().int().min(0),
  valueAfter: z.number().int().min(0),
  prayerSegment: z.enum(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'none']).default('none'),
  offlineId: z.string().uuid().optional(),
  atTs: z.string().datetime().or(z.date()).optional(),
  tz: z.string().default('UTC'),
});

const addFavoriteSchema = z.object({
  category: z.enum(['general', 'surah', 'ayah', 'dua', 'azkar', 'names99', 'salawat', 'kalimat']),
  itemId: z.string().min(1),
});

const upsertDailyAzkarSchema = z.object({
  dateLocal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  userId: z.string().optional(),
  fajr: z.number().int().min(0).optional().default(0),
  dhuhr: z.number().int().min(0).optional().default(0),
  asr: z.number().int().min(0).optional().default(0),
  maghrib: z.number().int().min(0).optional().default(0),
  isha: z.number().int().min(0).optional().default(0),
  total: z.number().int().min(0).optional().default(0),
  isComplete: z.boolean().optional().default(false),
});

/**
 * Автоматически обновляет прогресс всех активных целей, связанных с использованием тасбиха
 * @param userId - ID пользователя
 * @param category - Категория зикра (azkar, salawat, dua, kalimat и т.д.)
 * @param itemId - ID конкретного элемента зикра (опционально)
 * @param delta - Приращение прогресса (количество зикров)
 */
async function updateLinkedGoalsProgress(
  userId: string,
  category: string,
  itemId: string | null | undefined,
  delta: number
): Promise<void> {
  // Обновляем прогресс только для событий, которые увеличивают счетчик
  if (delta <= 0) return;

  try {
    // Найти все активные цели пользователя, связанные с этим типом зикра
    const activeGoals = await prisma.goal.findMany({
      where: {
        userId,
        status: 'active',
        linkedCounterType: category,
      },
    });

    // Обновить прогресс для каждой подходящей цели
    for (const goal of activeGoals) {
      // Пропускаем уже завершенные цели
      if (goal.status === 'completed') {
        continue;
      }

      // Проверяем соответствие itemId:
      // - Если в цели указан itemId, обновляем только если он совпадает
      // - Если в цели НЕ указан itemId, это общая цель для всей категории - обновляем всегда
      if (goal.itemId && goal.itemId !== itemId) {
        continue; // Пропускаем, если itemId не совпадает
      }

      // Сохраняем старое значение для логирования
      const oldProgress = goal.currentProgress;

      // Вычисляем новый прогресс (не превышаем targetCount)
      const newProgress = Math.min(oldProgress + delta, goal.targetCount);
      const isCompleted = newProgress >= goal.targetCount;

      // Обновляем цель только если прогресс изменился
      if (newProgress !== oldProgress) {
        await prisma.goal.update({
          where: { id: goal.id },
          data: {
            currentProgress: newProgress,
            status: isCompleted ? 'completed' : 'active',
            completedAt: isCompleted ? new Date() : goal.completedAt,
          },
        });

        logger.info(
          `Goal progress updated: ${goal.id} (${goal.title}) - ${oldProgress} → ${newProgress}/${goal.targetCount}${isCompleted ? ' [COMPLETED]' : ''}`
        );

        // Отправить уведомление при завершении цели
        if (isCompleted) {
          try {
            const { notificationScheduler } = await import("../lib/notification-scheduler");
            await notificationScheduler.sendGoalCompletedNotification(userId, goal);
          } catch (notifError) {
            logger.error(`Error sending goal completed notification:`, notifError);
            // Не прерываем выполнение, если отправка уведомления не удалась
          }
          
          // Проверить, нужно ли автоматически возобновить повторяющуюся цель
          if (goal.repeatType === 'weekly' || goal.repeatType === 'monthly') {
            try {
              const { renewUserRepeatingGoals } = await import("../lib/goal-auto-renewal");
              await renewUserRepeatingGoals(userId);
            } catch (renewError) {
              logger.error(`Error renewing repeating goal:`, renewError);
            }
          }
        }
      }
    }
  } catch (error) {
    logger.error(`Error updating linked goals progress:`, error);
    // Не прерываем выполнение, если обновление целей не удалось
  }
}

// Получить каталог дуа и азкаров из Bot.e-replika.ru
router.get("/catalog", async (req, res, next) => {
  try {
    // Авторизация отключена - всегда используем userId из заголовка или default-user
    const userId = getUserId(req) || (req as any).userId || "default-user";

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
    // Авторизация отключена - всегда используем userId из заголовка или default-user
    const userId = getUserId(req) || (req as any).userId || "default-user";

    const category = req.params.category; // dua, azkar, salawat, kalima

    try {
      const apiUserId = getUserIdForApi(req);
      const data = await botReplikaGet<{ items?: unknown[] }>(`/api/dhikr/catalog/${category}`, apiUserId);
      res.json({ items: data.items || data });
    } catch (apiError: any) {
      logger.warn(`Bot.e-replika.ru API unavailable for catalog category ${category}, returning empty array:`, apiError.message);
      // Возвращаем пустой массив - фронтенд использует статические данные как fallback
      res.json({ items: [] });
    }
  } catch (error) {
    next(error);
  }
});

router.get("/logs", async (req, res, next) => {
  try {
    // Авторизация отключена - всегда используем userId из заголовка или default-user
    const userId = getUserId(req) || (req as any).userId || "default-user";
    
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
    // Авторизация отключена - всегда используем userId из заголовка или default-user
    const userId = getUserId(req) || (req as any).userId || "default-user";
    
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
    // Авторизация отключена - всегда используем userId из заголовка или default-user
    const userId = getUserId(req) || (req as any).userId || "default-user";
    
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
    
    // Валидация через Zod схему
    let logData;
    try {
      logData = createDhikrLogSchema.parse(req.body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error(`POST /api/dhikr/logs: Validation error`, { 
          errors: error.errors,
          body: req.body,
          userId 
        });
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
      throw error;
    }
    
    // Логируем входящий запрос для отладки
    logger.info(`POST /api/dhikr/logs request`, { 
      userId, 
      body: logData,
      headers: req.headers 
    });
    
    const category = logData.category;
    const itemId = logData.itemId;
    const delta = logData.delta;
    const eventType = logData.eventType;
    const sessionId = logData.sessionId;
    const prayerSegment = logData.prayerSegment;
    const valueAfter = logData.valueAfter;
    
    // Расширенное анти-чит логирование: проверка аномально высокой активности
    if (delta > 0 && (eventType === 'tap' || eventType === 'bulk' || eventType === 'repeat')) {
      // Проверить количество тапов за последние 5 секунд
      const fiveSecondsAgo = new Date(Date.now() - 5000);
      const recentLogs = await prisma.dhikrLog.findMany({
        where: {
          userId,
          atTs: {
            gte: fiveSecondsAgo,
          },
          eventType: {
            in: ['tap', 'bulk', 'repeat'],
          },
        },
      });

      const recentTapCount = recentLogs.reduce((sum, log) => sum + log.delta, 0) + delta;
      
      // Если >100 тапов в секунду (за последние 5 секунд это было бы >500)
      if (recentTapCount > 500) {
        logger.warn(`[ANTI-CHEAT] Suspicious activity detected for user ${userId}: ${recentTapCount} taps in last 5 seconds`, {
          userId,
          recentTapCount,
          currentDelta: delta,
          eventType,
          sessionId,
          suspected: true,
        });
        
        // Логируем в специальную таблицу или метрики (можно добавить отдельную таблицу для подозрительной активности)
        // Пока просто логируем в общий лог с пометкой
      }
    }
    
    // Обновляем прогресс только для событий, которые увеличивают счетчик
    const shouldUpdateProgress = ['tap', 'bulk', 'repeat'].includes(eventType) && delta > 0;
    
    let log: any;
    let updatedGoal: any = null;
    let updatedDailyAzkar: any = null;
    
    try {
      const apiUserId = getUserIdForApi(req);
      const data = await botReplikaPost<{ log?: unknown }>("/api/dhikr/logs", logData, apiUserId);
      log = data.log || data;
      
      // Автоматически обновить прогресс связанных целей (личных и групповых)
      if (shouldUpdateProgress && category) {
        // Оптимизация: обновляем прогресс и получаем цель параллельно
        const [, linkedGoal] = await Promise.all([
          Promise.all([
            updateLinkedGoalsProgress(userId, category, itemId, delta),
            updateGroupGoalsProgress(userId, category, itemId, delta),
          ]),
          prisma.goal.findFirst({
            where: {
              userId,
              status: 'active',
              linkedCounterType: category,
              ...(itemId ? { itemId } : {}),
            },
          }),
        ]);
        
        if (linkedGoal) {
          updatedGoal = {
            id: linkedGoal.id,
            currentProgress: linkedGoal.currentProgress,
            targetCount: linkedGoal.targetCount,
            status: linkedGoal.status,
            isCompleted: linkedGoal.status === 'completed',
          };
        }
      }
      
      // Получить обновленный daily_azkar если это азкары после намаза
      if (shouldUpdateProgress && prayerSegment !== 'none') {
        const today = new Date().toISOString().split('T')[0];
        updatedDailyAzkar = await storage.getDailyAzkar(userId, today) || {
          userId,
          dateLocal: today,
          fajr: 0,
          dhuhr: 0,
          asr: 0,
          maghrib: 0,
          isha: 0,
          total: 0,
          isComplete: false,
        };
      }
      
      // Response согласно ТЗ: { value_after, goal_progress, daily_azkar }
      res.status(201).json({
        value_after: valueAfter,
        goal_progress: updatedGoal,
        daily_azkar: updatedDailyAzkar,
        log, // Также возвращаем сам лог для обратной совместимости
      });
    } catch (apiError: any) {
      logger.warn("Bot.e-replika.ru API unavailable, using local DB:", apiError.message);
      try {
        log = await storage.createDhikrLog(userId, logData);
      } catch (dbError: any) {
        logger.error("Failed to create dhikr log in local DB", {
          error: dbError.message,
          errorCode: dbError.code,
          errorMeta: dbError.meta,
          requestBody: req.body,
          userId,
        });
        return res.status(400).json({
          error: "Validation error",
          message: dbError.message || "Ошибка валидации данных при создании записи",
          details: dbError.meta,
        });
      }
      
      // Автоматически обновить прогресс связанных целей (личных и групповых)
      if (shouldUpdateProgress && category) {
        // Оптимизация: обновляем прогресс и получаем цель параллельно
        const [, linkedGoal] = await Promise.all([
          Promise.all([
            updateLinkedGoalsProgress(userId, category, itemId, delta),
            updateGroupGoalsProgress(userId, category, itemId, delta),
          ]),
          prisma.goal.findFirst({
            where: {
              userId,
              status: 'active',
              linkedCounterType: category,
              ...(itemId ? { itemId } : {}),
            },
          }),
        ]);
        
        if (linkedGoal) {
          updatedGoal = {
            id: linkedGoal.id,
            currentProgress: linkedGoal.currentProgress,
            targetCount: linkedGoal.targetCount,
            status: linkedGoal.status,
            isCompleted: linkedGoal.status === 'completed',
          };
        }
      }
      
      // Получить обновленный daily_azkar если это азкары после намаза
      if (shouldUpdateProgress && prayerSegment !== 'none') {
        const today = new Date().toISOString().split('T')[0];
        updatedDailyAzkar = await storage.getDailyAzkar(userId, today) || {
          userId,
          dateLocal: today,
          fajr: 0,
          dhuhr: 0,
          asr: 0,
          maghrib: 0,
          isha: 0,
          total: 0,
          isComplete: false,
        };
      }
      
      // Response согласно ТЗ: { value_after, goal_progress, daily_azkar }
      res.status(201).json({
        value_after: valueAfter,
        goal_progress: updatedGoal,
        daily_azkar: updatedDailyAzkar,
        log, // Также возвращаем сам лог для обратной совместимости
      });
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
    // Авторизация отключена - всегда используем userId из заголовка или default-user
    const userId = getUserId(req) || (req as any).userId || "default-user";
    
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
        // Возвращаем пустой объект вместо 404, чтобы фронтенд мог работать
        res.json({ 
          azkar: {
            userId,
            dateLocal: req.params.dateLocal,
            fajr: 0,
            dhuhr: 0,
            asr: 0,
            maghrib: 0,
            isha: 0,
            total: 0,
            isComplete: false,
            updatedAt: new Date(),
          }
        });
        return;
      }
      res.json({ azkar });
    }
  } catch (error) {
    next(error);
  }
});

router.post("/daily-azkar", async (req, res, next) => {
  try {
    // Авторизация отключена - всегда используем userId из заголовка или default-user
    const userId = getUserId(req) || (req as any).userId || "default-user";
    
    // Валидация через Zod схему
    let body;
    try {
      body = upsertDailyAzkarSchema.parse(req.body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error(`POST /api/dhikr/daily-azkar: Validation error`, { 
          errors: error.errors,
          body: req.body,
          userId 
        });
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
      throw error;
    }
    
    try {
      const apiUserId = getUserIdForApi(req);
      const data = await botReplikaPost<{ azkar?: unknown }>("/api/dhikr/daily-azkar", body, apiUserId);
      const azkar = data.azkar || data;
      res.json({ azkar });
    } catch (apiError: any) {
      logger.warn("Bot.e-replika.ru API unavailable, using local DB:", apiError.message);
      
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
      
      // Удаляем userId из body, так как Prisma использует связь через user
      // Гарантируем что все числовые поля являются числами (могут прийти как строки)
      const { userId: _, ...azkarData } = body as any;
      const cleanData = {
        ...azkarData,
        fajr: Number(azkarData.fajr) || 0,
        dhuhr: Number(azkarData.dhuhr) || 0,
        asr: Number(azkarData.asr) || 0,
        maghrib: Number(azkarData.maghrib) || 0,
        isha: Number(azkarData.isha) || 0,
        total: Number(azkarData.total) || 0,
        isComplete: Boolean(azkarData.isComplete),
      };
      const azkar = await storage.upsertDailyAzkar(userId, cleanData);
      res.json({ azkar });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/dhikr/logs/last
 * Удаление последней записи из dhikr_log (для Undo функционала)
 * 
 * Query params:
 * - sessionId: string (опционально, если нужно удалить последний лог конкретной сессии)
 * 
 * Response: { deleted: boolean, log_id: string }
 */
router.delete("/logs/last", async (req, res, next) => {
  try {
    // Авторизация отключена - всегда используем userId из заголовка или default-user
    const userId = getUserId(req) || (req as any).userId || "default-user";

    const sessionId = req.query.sessionId as string | undefined;

    // Найти последний лог пользователя (или последний лог сессии)
    const whereClause: any = {
      userId,
      // Удалять только логи, которые увеличивали счетчик (tap, bulk, repeat)
      eventType: {
        in: ['tap', 'bulk', 'repeat'],
      },
    };

    if (sessionId) {
      whereClause.sessionId = sessionId;
    }

    const lastLog = await prisma.dhikrLog.findFirst({
      where: whereClause,
      orderBy: {
        atTs: 'desc',
      },
    });

    if (!lastLog) {
      // Возвращаем 200 с информацией, что нечего отменять (не ошибка)
      return res.status(200).json({ 
        deleted: false,
        message: "Нет действий для отмены",
        reason: sessionId ? "Логи для этой сессии не найдены" : "Логи не найдены"
      });
    }

    // Проверить, что лог был создан не более 5 секунд назад (защита от старых отмен)
    const logAge = Date.now() - lastLog.atTs.getTime();
    if (logAge > 5000) {
      return res.status(400).json({ 
        error: "Cannot undo old action",
        message: "Отмена доступна только в течение 5 секунд после действия",
      });
    }

    // Откатить прогресс целей (если был обновлен)
    if (lastLog.delta > 0 && lastLog.category) {
      const category = lastLog.category;
      const itemId = lastLog.itemId;

      // Найти все активные цели, которые были обновлены этим логом
      const activeGoals = await prisma.goal.findMany({
        where: {
          userId,
          status: { in: ['active', 'completed'] },
          linkedCounterType: category,
          ...(itemId ? { itemId } : {}),
        },
      });

      // Откатить прогресс каждой цели
      for (const goal of activeGoals) {
        const newProgress = Math.max(0, goal.currentProgress - lastLog.delta);
        const newStatus = newProgress >= goal.targetCount ? 'completed' : 'active';

        await prisma.goal.update({
          where: { id: goal.id },
          data: {
            currentProgress: newProgress,
            status: newStatus === 'completed' && goal.status === 'completed' ? 'completed' : 
                   newProgress >= goal.targetCount ? 'completed' : 'active',
            completedAt: newProgress >= goal.targetCount ? goal.completedAt : null,
          },
        });
      }

      // Откатить групповые цели
      try {
        const { updateGroupGoalsProgress } = await import("../lib/group-goal-sync");
        // Передаем отрицательный delta для отката
        await updateGroupGoalsProgress(userId, category, itemId, -lastLog.delta);
      } catch (error) {
        logger.warn("Failed to rollback group goals:", error);
      }

      // Откатить daily_azkar, если это был лог после намаза
      if (lastLog.prayerSegment !== 'none') {
        const today = new Date().toISOString().split('T')[0];
        const dailyAzkar = await prisma.dailyAzkar.findUnique({
          where: {
            userId_dateLocal: {
              userId,
              dateLocal: today,
            },
          },
        });

        if (dailyAzkar) {
          const prayerField = lastLog.prayerSegment as keyof typeof dailyAzkar;
          const currentValue = dailyAzkar[prayerField] as number;
          const newValue = Math.max(0, currentValue - lastLog.delta);
          const newTotal = Math.max(0, dailyAzkar.total - lastLog.delta);

          await prisma.dailyAzkar.update({
            where: {
              userId_dateLocal: {
                userId,
                dateLocal: today,
              },
            },
            data: {
              [prayerField]: newValue,
              total: newTotal,
              isComplete: newTotal >= 495, // 5 * 99
            },
          });
        }
      }
    }

    // Удалить лог
    await prisma.dhikrLog.delete({
      where: { id: lastLog.id },
    });

    res.json({
      deleted: true,
      log_id: lastLog.id,
      delta: lastLog.delta,
    });
  } catch (error) {
    logger.error("Error in DELETE /api/dhikr/logs/last:", error);
    next(error);
  }
});

// GET /api/dhikr/favorites - получить избранные зикры пользователя
router.get("/favorites", async (req, res, next) => {
  try {
    logger.info("GET /api/dhikr/favorites called");
    const userId = getUserId(req) || (req as any).userId || "default-user";
    
    try {
      const apiUserId = getUserIdForApi(req);
      const data = await botReplikaGet<{ favorites?: unknown[] }>("/api/dhikr/favorites", apiUserId);
      res.json({ favorites: data.favorites || data || [] });
    } catch (apiError: any) {
      logger.warn("Bot.e-replika.ru API unavailable, using local DB:", apiError.message);
      
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const favorites = (user?.favorites as any) || [];
      res.json({ favorites });
    }
  } catch (error) {
    next(error);
  }
});

// POST /api/dhikr/favorites - добавить зикр в избранное
router.post("/favorites", async (req, res, next) => {
  try {
    const userId = getUserId(req) || (req as any).userId || "default-user";
    
    // Валидация через Zod схему
    let body;
    try {
      body = addFavoriteSchema.parse(req.body);
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
      throw error;
    }
    
    const { category, itemId } = body;
    
    try {
      const apiUserId = getUserIdForApi(req);
      const data = await botReplikaPost<{ favorites?: unknown[] }>("/api/dhikr/favorites", body, apiUserId);
      res.json({ favorites: data.favorites || data || [] });
    } catch (apiError: any) {
      logger.warn("Bot.e-replika.ru API unavailable, using local DB:", apiError.message);
      
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const favorites: Array<{ category: string; itemId: string }> = (user?.favorites as any) || [];
      
      // Проверяем, нет ли уже этого зикра в избранном
      const exists = favorites.some(f => f.category === category && f.itemId === itemId);
      if (!exists) {
        favorites.push({ category, itemId });
        await prisma.user.update({
          where: { id: userId },
          data: { favorites: favorites as any },
        });
      }
      
      res.json({ favorites });
    }
  } catch (error) {
    next(error);
  }
});

// DELETE /api/dhikr/favorites - удалить зикр из избранного
router.delete("/favorites", async (req, res, next) => {
  try {
    const userId = getUserId(req) || (req as any).userId || "default-user";
    const { category, itemId } = req.query;
    
    if (!category || !itemId) {
      return res.status(400).json({ error: "Invalid input", message: "category and itemId query params are required" });
    }
    
    try {
      const apiUserId = getUserIdForApi(req);
      const data = await botReplikaDelete<{ favorites?: unknown[] }>(`/api/dhikr/favorites?category=${category}&itemId=${itemId}`, apiUserId);
      res.json({ favorites: data.favorites || data || [] });
    } catch (apiError: any) {
      logger.warn("Bot.e-replika.ru API unavailable, using local DB:", apiError.message);
      
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const favorites: Array<{ category: string; itemId: string }> = (user?.favorites as any) || [];
      
      // Удаляем зикр из избранного
      const filtered = favorites.filter(f => !(f.category === category && f.itemId === itemId));
      await prisma.user.update({
        where: { id: userId },
        data: { favorites: filtered as any },
      });
      
      res.json({ favorites: filtered });
    }
  } catch (error) {
    next(error);
  }
});

export default router;

