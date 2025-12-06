import { Router } from "express";
import { storage } from "../storage";
import { requireAuth, getUserId } from "../middleware/auth";
import { z } from "zod";
import { botReplikaGet, botReplikaPost, botReplikaPatch, botReplikaDelete, getUserIdForApi } from "../lib/bot-replika-api";
import { logger } from "../lib/logger";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const apiUserId = getUserIdForApi(req);
      const data = await botReplikaGet<{ tasks?: unknown[] }>("/api/tasks", apiUserId);
      res.json({ tasks: data.tasks || data });
    } catch (apiError: any) {
      logger.warn("Bot.e-replika.ru API unavailable, using local DB:", apiError.message);
      const tasks = await storage.getTasks(userId);
      res.json({ tasks });
    }
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const apiUserId = getUserIdForApi(req);
      const data = await botReplikaGet<{ task?: unknown }>(`/api/tasks/${req.params.id}`, apiUserId);
      const task = data.task || data;
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json({ task });
    } catch (apiError: any) {
      logger.warn("Bot.e-replika.ru API unavailable, using local DB:", apiError.message);
      const task = await storage.getTask(req.params.id, userId);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json({ task });
    }
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const apiUserId = getUserIdForApi(req);
      const data = await botReplikaPost<{ task?: unknown }>("/api/tasks", req.body, apiUserId);
      const task = data.task || data;
      res.status(201).json({ task });
    } catch (apiError: any) {
      logger.warn("Bot.e-replika.ru API unavailable, using local DB:", apiError.message);
      const task = await storage.createTask(userId, req.body);
      res.status(201).json({ task });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const apiUserId = getUserIdForApi(req);
      const data = await botReplikaPatch<{ task?: unknown }>(`/api/tasks/${req.params.id}`, req.body, apiUserId);
      const task = data.task || data;
      res.json({ task });
    } catch (apiError: any) {
      logger.warn("Bot.e-replika.ru API unavailable, using local DB:", apiError.message);
      const task = await storage.updateTask(req.params.id, userId, req.body);
      res.json({ task });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    if (error instanceof Error && error.message === "Task not found") {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const apiUserId = getUserIdForApi(req);
      await botReplikaDelete(`/api/tasks/${req.params.id}`, apiUserId);
      res.json({ message: "Task deleted successfully" });
    } catch (apiError: any) {
      logger.warn("Bot.e-replika.ru API unavailable, using local DB:", apiError.message);
      await storage.deleteTask(req.params.id, userId);
      res.json({ message: "Task deleted successfully" });
    }
  } catch (error) {
    next(error);
  }
});

export default router;

