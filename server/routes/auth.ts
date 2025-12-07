import { Router, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { botReplikaGet, botReplikaPost, getUserIdForApi } from "../lib/bot-replika-api";
import { logger } from "../lib/logger";
import { randomUUID } from "crypto";

const router = Router();

// Token-based auth for Bot.e-replika.ru integration
const TEST_TOKEN = process.env.TEST_TOKEN || "test_token_123";

// Middleware to check token or session
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // Check for token in header
  const token = req.headers.authorization?.replace("Bearer ", "") || 
                req.headers["x-api-token"] as string;
  
  if (token === TEST_TOKEN) {
    // Token auth - get user from token (could be extended to validate token with Bot.e-replika.ru)
    (req as any).authType = "token";
    (req as any).userId = req.headers["x-user-id"] as string || "default-user";
    return next();
  }
  
  // Check session
  if (req.session?.userId) {
    (req as any).authType = "session";
    return next();
  }
  
  return res.status(401).json({ error: "Unauthorized" });
}

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const registerSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

// Создание гостевой сессии автоматически
router.post("/guest", async (req, res, next) => {
  try {
    // Проверяем, есть ли уже сессия
    if (req.session?.userId) {
      const user = await storage.getUser(req.session.userId);
      if (user) {
        return res.json({
          user: {
            id: user.id,
            username: user.username,
          }
        });
      }
    }

    // Создаем временного пользователя
    const guestUsername = `Гость_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    try {
      const user = await storage.createUser({
        username: guestUsername,
        password: randomUUID(), // Случайный пароль, будет захеширован в storage.createUser
      });

      req.session!.userId = user.id;
      
      res.json({
        user: {
          id: user.id,
          username: user.username,
        }
      });
    } catch (error: any) {
      logger.error("Failed to create guest user:", error);
      return res.status(500).json({ error: "Failed to create guest session" });
    }
  } catch (error) {
    next(error);
  }
});

router.post("/register", async (req, res, next) => {
  try {
    const parsed = registerSchema.parse(req.body);
    
    try {
      // Проксировать регистрацию в Bot.e-replika.ru API
      const data = await botReplikaPost<{ user?: { id: string; username: string } }>(
        "/auth/register",
        parsed,
        undefined
      );
      
      const userData = data.user || data;
      if (userData && typeof userData === 'object' && 'id' in userData) {
        const userId = String(userData.id);
        const username = (userData.username && typeof userData.username === 'string') 
          ? userData.username 
          : parsed.username;
        
        // Синхронизировать с локальной БД (если нужно)
        try {
          const existing = await storage.getUserByUsername(parsed.username);
          if (!existing) {
            await storage.createUser({ ...parsed, id: userId });
          }
        } catch (localError) {
          // Игнорируем ошибки локальной синхронизации
          logger.warn("Local user sync failed:", localError);
        }
        
        // Set session
        req.session!.userId = userId;
        
        res.json({ 
          user: {
            id: userId,
            username: username,
          }
        });
      } else {
        return res.status(400).json({ error: "Registration failed" });
      }
    } catch (apiError: any) {
      // Fallback на локальную регистрацию
      logger.warn("Bot.e-replika.ru API unavailable, using local registration:", apiError.message);
      
      const existing = await storage.getUserByUsername(parsed.username);
      if (existing) {
        return res.status(400).json({ error: "Username already exists" });
      }
      
      const user = await storage.createUser(parsed);
      req.session!.userId = user.id;
      
      res.json({ 
        user: {
          id: user.id,
          username: user.username,
        }
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const parsed = loginSchema.parse(req.body);
    
    try {
      // Проксировать вход в Bot.e-replika.ru API
      const data = await botReplikaPost<{ user?: { id: string; username: string }; token?: string }>(
        "/auth/login",
        parsed,
        undefined
      );
      
      const userData = data.user || data;
      if (userData && typeof userData === 'object' && 'id' in userData) {
        const userId = String(userData.id);
        const username = (userData.username && typeof userData.username === 'string') 
          ? userData.username 
          : parsed.username;
        
        // Set session
        req.session!.userId = userId;
        
        res.json({ 
          user: {
            id: userId,
            username: username,
          },
          token: data.token,
        });
      } else {
        return res.status(401).json({ error: "Invalid credentials" });
      }
    } catch (apiError: any) {
      // Fallback на локальный вход
      logger.warn("Bot.e-replika.ru API unavailable, using local login:", apiError.message);
      
      const user = await storage.getUserByUsername(parsed.username);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      const isValid = await storage.verifyPassword(parsed.password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      req.session!.userId = user.id;
      
      res.json({ 
        user: {
          id: user.id,
          username: user.username,
        }
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    next(error);
  }
});

router.post("/logout", (req, res) => {
  req.session?.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Failed to logout" });
    }
    res.json({ message: "Logged out successfully" });
  });
});

router.get("/me", authMiddleware, async (req, res) => {
  const userId = (req as any).userId || req.session?.userId;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  try {
    // Проксировать запрос профиля в Bot.e-replika.ru API
    const apiUserId = getUserIdForApi(req);
    const data = await botReplikaGet<{ user?: { id: string; username: string; [key: string]: any } }>(
      "/auth/me",
      apiUserId
    );
    
    const userData = data.user || data;
    if (userData && typeof userData === 'object' && 'id' in userData) {
      const userId = String(userData.id);
      const username = (userData.username && typeof userData.username === 'string') 
        ? userData.username 
        : undefined;
      
      return res.json({ 
        user: {
          id: userId,
          username: username || (userData as any).username || '',
        }
      });
    }
  } catch (apiError: any) {
    // Fallback на локальный профиль
    logger.warn("Bot.e-replika.ru API unavailable, using local profile:", apiError.message);
  }
  
  // Fallback на локальную БД
  const user = await storage.getUser(userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  
  res.json({
    user: {
      id: user.id,
      username: user.username,
    }
  });
});

// Token validation endpoint for Bot.e-replika.ru
router.post("/validate-token", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "") || 
                req.body.token;
  
  if (!token) {
    return res.status(401).json({ valid: false, error: "Token is required" });
  }
  
  // Сначала проверяем локальный токен
  if (token === TEST_TOKEN) {
    return res.json({ valid: true, userId: req.body.userId || "default-user" });
  }
  
  try {
    // Валидация через Bot.e-replika.ru API
    const data = await botReplikaPost<{ valid?: boolean; userId?: string }>(
      "/auth/validate-token",
      { token },
      undefined
    );
    
    if (data.valid) {
      return res.json({ valid: true, userId: data.userId || req.body.userId || "default-user" });
    }
    
    return res.status(401).json({ valid: false, error: "Invalid token" });
  } catch (apiError: any) {
    // Если API недоступен, используем локальную проверку
    logger.warn("Bot.e-replika.ru API unavailable, using local validation:", apiError.message);
    return res.status(401).json({ valid: false, error: "Invalid token" });
  }
});

export default router;
