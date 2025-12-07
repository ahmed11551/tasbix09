import { Router } from "express";
import { requireAuth, getUserId } from "../middleware/auth";
import { botReplikaGet, botReplikaPatch, getUserIdForApi } from "../lib/bot-replika-api";
import { storage } from "../storage";
import { logger } from "../lib/logger";

const router = Router();
router.use(requireAuth);

// GET /api/users - получить профиль текущего пользователя
router.get("/", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const apiUserId = getUserIdForApi(req);
      const data = await botReplikaGet<{ user?: unknown }>("/users", apiUserId);
      res.json({ user: data.user || data });
    } catch (apiError: any) {
      logger.warn("Bot.e-replika.ru API unavailable, using local DB:", apiError.message);
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
    }
  } catch (error) {
    next(error);
  }
});

// GET /api/users/profile - получить расширенный профиль
router.get("/profile", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const apiUserId = getUserIdForApi(req);
      const data = await botReplikaGet<{ profile?: unknown }>("/users/profile", apiUserId);
      res.json({ profile: data.profile || data });
    } catch (apiError: any) {
      logger.warn("Bot.e-replika.ru API unavailable, using local DB:", apiError.message);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({
        profile: {
          id: user.id,
          username: user.username,
        }
      });
    }
  } catch (error) {
    next(error);
  }
});

// PATCH /api/users/profile - обновить профиль
router.patch("/profile", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const apiUserId = getUserIdForApi(req);
      const data = await botReplikaPatch<{ profile?: unknown }>("/users/profile", req.body, apiUserId);
      res.json({ profile: data.profile || data });
    } catch (apiError: any) {
      logger.warn("Bot.e-replika.ru API unavailable, using local DB:", apiError.message);
      res.status(503).json({ error: "Profile update unavailable" });
    }
  } catch (error) {
    next(error);
  }
});

export default router;

