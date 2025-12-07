import { Router, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { prisma } from "../db-prisma";
import { z } from "zod";
import crypto from "crypto";
import { botReplikaPost, getUserIdForApi } from "../lib/bot-replika-api";
import { logger } from "../lib/logger";

const router = Router();

const telegramAuthSchema = z.object({
  id: z.number(),
  username: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  photoUrl: z.string().optional(),
  initData: z.string().optional(),
});

// Валидация данных от Telegram (для продакшена)
function validateTelegramData(initData: string, botToken: string): boolean {
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    if (!hash) return false;

    urlParams.delete('hash');
    
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();
    
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');
    
    return calculatedHash === hash;
  } catch (error) {
    logger.error('Telegram validation error:', error);
    return false;
  }
}

router.post("/auth", async (req, res, next) => {
  try {
    const parsed = telegramAuthSchema.parse(req.body);
    
    // В продакшене валидировать initData
    if (parsed.initData && process.env.TELEGRAM_BOT_TOKEN) {
      const isValid = validateTelegramData(parsed.initData, process.env.TELEGRAM_BOT_TOKEN);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid Telegram data" });
      }
    }
    
    try {
      // Проксировать авторизацию Telegram в Bot.e-replika.ru API
      const data = await botReplikaPost<{ user?: { id: string; username: string; [key: string]: any } }>(
        "/telegram/auth",
        parsed,
        undefined
      );
      
      const userData = data.user || data;
      if (userData && typeof userData === 'object' && 'id' in userData && typeof userData.id === 'string') {
        const userId = userData.id;
        const username = (userData.username && typeof userData.username === 'string') ? userData.username : `tg_user_${parsed.id}`;
        
        // Синхронизировать с локальной БД
        try {
          const existing = await storage.getUser(userId);
          if (!existing) {
            const randomPassword = crypto.randomBytes(32).toString('hex');
            await prisma.user.upsert({
              where: { username: username },
              update: {
                telegramId: String(parsed.id),
                firstName: parsed.firstName || null,
              },
              create: {
                // id НЕ указываем - Prisma генерирует автоматически
                username: username,
                password: await storage.hashPassword(randomPassword),
                telegramId: String(parsed.id),
                firstName: parsed.firstName || null,
              },
            });
          } else {
            // Обновить telegramId и firstName если их нет
            await prisma.user.update({
              where: { id: userId },
              data: {
                telegramId: String(parsed.id),
                firstName: parsed.firstName || existing.firstName || null,
              },
            });
          }
        } catch (localError) {
          logger.warn("Local user sync failed:", localError);
        }
        
        req.session!.userId = userId;
        
        return res.json({
          user: {
            id: userId,
            username: username,
          }
        });
      }
    } catch (apiError: any) {
      // Fallback на локальную авторизацию
      logger.warn("Bot.e-replika.ru API unavailable, using local Telegram auth:", apiError.message);
    }
    
    // Fallback: локальная авторизация Telegram
    const telegramId = `tg_${parsed.id}`;
    
    let user = await storage.getUser(telegramId);
    
    if (!user) {
      const telegramUsername = `tg_user_${parsed.id}`;
      user = await storage.getUserByUsername(telegramUsername);
    }
    
    if (!user) {
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const username = parsed.username 
        ? `tg_${parsed.username}` 
        : `tg_user_${parsed.id}`;
      
      user = await prisma.user.upsert({
        where: { username: username },
        update: {
          telegramId: String(parsed.id),
          firstName: parsed.firstName || null,
        },
        create: {
          // id НЕ указываем - Prisma генерирует автоматически
          username: username,
          password: await storage.hashPassword(randomPassword),
          telegramId: String(parsed.id),
          firstName: parsed.firstName || null,
        },
      });
    } else {
      // Обновить telegramId и firstName если их нет
      await prisma.user.update({
        where: { id: user.id },
        data: {
          telegramId: String(parsed.id),
          firstName: parsed.firstName || user.firstName || null,
        },
      });
      // Обновить объект user для ответа
      user = await storage.getUser(user.id);
    }
    
    if (!user) {
      return res.status(500).json({ error: "Failed to create or retrieve user" });
    }
    
    req.session!.userId = user.id;
    
    res.json({
      user: {
        id: user.id,
        username: user.username,
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    next(error);
  }
});

export default router;

