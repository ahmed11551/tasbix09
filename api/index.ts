// Vercel Serverless Function для обработки всех API запросов
import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import { registerRoutes } from '../server/routes';
import { errorHandler } from '../server/middleware/error-handler';
import session from 'express-session';
import MemoryStore from 'memorystore';
import cors from 'cors';

const app = express();

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
    secret: process.env.SESSION_SECRET || 'dev-secret',
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

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Регистрация роутов
(async () => {
  await registerRoutes(null as any, app);
  app.use(errorHandler);
})();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return app(req as any, res as any);
}
