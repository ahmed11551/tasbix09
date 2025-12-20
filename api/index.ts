// Vercel Serverless Function для обработки всех API запросов
import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import { registerRoutes } from '../server/routes';
import { errorHandler } from '../server/middleware/error-handler';
import session from 'express-session';
import MemoryStore from 'memorystore';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - типы cors доступны через @types/cors, но TypeScript на Vercel может не видеть их
import cors from 'cors';

// Инициализация Express приложения (singleton для переиспользования между вызовами)
let app: express.Express | null = null;
let routesRegistered = false;

function getApp(): express.Express {
  if (!app) {
    app = express();

    // CORS для Telegram WebApp (синхронизировано с server/index.ts)
    app.use(cors({
      origin: [
        'https://web.telegram.org',
        'https://telegram.org',
        process.env.FRONTEND_URL || 'http://localhost:5000',
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id', 'X-API-Token'],
    }));

    // Session
    const SessionStore = MemoryStore(session);
    app.use(
      session({
        secret: process.env.SESSION_SECRET || 'dev-secret-key-change-in-production',
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: process.env.NODE_ENV === 'production',
          httpOnly: true,
          maxAge: 1000 * 60 * 60 * 24 * 7,
        },
        store: new SessionStore({
          checkPeriod: 86400000,
        }),
      })
    );

    app.use(express.json({
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    }));
    app.use(express.urlencoded({ extended: false }));

    // Регистрация роутов
    registerRoutes(null as any, app).then(() => {
      app!.use(errorHandler);
      routesRegistered = true;
    }).catch((err) => {
      console.error('Failed to register routes:', err);
      routesRegistered = false;
    });
  }

  return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Проверка DATABASE_URL перед обработкой запроса
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL не установлен в переменных окружения Vercel!');
      return res.status(503).json({
        error: 'Database configuration missing',
        message: 'DATABASE_URL не настроен. Пожалуйста, добавьте DATABASE_URL в настройках Vercel (Settings → Environment Variables).',
        hint: 'См. DATABASE_SETUP.md для инструкций по настройке базы данных.'
      });
    }

    const expressApp = getApp();
    
    // Ждем регистрацию роутов если еще не завершена
    if (!routesRegistered) {
      await new Promise<void>((resolve) => {
        const checkInterval = setInterval(() => {
          if (routesRegistered) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 50);
        
        // Timeout после 5 секунд
        setTimeout(() => {
          clearInterval(checkInterval);
          if (!routesRegistered) {
            console.error('⚠️ Routes registration timeout');
          }
          resolve();
        }, 5000);
      });
    }
    
    return new Promise<void>((resolve) => {
      expressApp(req as any, res as any, (err?: any) => {
        if (err) {
          console.error('Express error:', err);
          if (!res.headersSent) {
            res.status(500).json({ 
              error: 'Internal server error',
              message: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
          }
        }
        resolve();
      });
    });
  } catch (error: any) {
    console.error('Handler error:', error);
    console.error('Error name:', error?.name);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    console.error('DATABASE_URL present:', !!process.env.DATABASE_URL);
    
    if (!res.headersSent) {
      // Проверка на ошибки подключения к БД
      const errorMessage = (error?.message || '').toLowerCase();
      const errorName = (error?.name || '').toLowerCase();
      
      if (
        !process.env.DATABASE_URL ||
        errorMessage.includes('database') || 
        errorMessage.includes('prisma') || 
        errorMessage.includes('connection') ||
        errorMessage.includes('p1001') ||
        errorMessage.includes('p1002') ||
        errorMessage.includes('p1003') ||
        errorName.includes('prisma') ||
        errorName.includes('initialization')
      ) {
        return res.status(503).json({
          error: 'Database connection failed',
          message: !process.env.DATABASE_URL 
            ? 'DATABASE_URL не установлен в переменных окружения Vercel'
            : 'Не удалось подключиться к базе данных',
          hint: 'Проверьте DATABASE_URL в Settings → Environment Variables → Production/Preview/Development. Убедитесь, что база данных создана и доступна.'
        });
      }
      
      res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Произошла ошибка при обработке запроса',
        ...(process.env.NODE_ENV === 'development' && {
          name: error?.name,
          stack: error?.stack
        })
      });
    }
  }
}
