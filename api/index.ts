// Vercel Serverless Function для обработки всех API запросов
import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import { registerRoutes } from '../server/routes';
import { errorHandler } from '../server/middleware/error-handler';
import session from 'express-session';
import MemoryStore from 'memorystore';
import cors from 'cors';

// Инициализация Express приложения (singleton для переиспользования между вызовами)
let app: express.Express | null = null;
let routesRegistered = false;

function getApp(): express.Express {
  if (!app) {
    app = express();

    // CORS для Telegram
    app.use(cors({
      origin: [
        'https://web.telegram.org',
        'https://telegram.org',
        process.env.FRONTEND_URL || '*',
      ],
      credentials: true,
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
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Произошла ошибка при обработке запроса'
      });
    }
  }
}
