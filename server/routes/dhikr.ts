import { Router } from "express";
import { storage } from "../storage";
import { requireAuth, getUserId } from "../middleware/auth";
import { z } from "zod";

const router = Router();
router.use(requireAuth);

router.get("/logs", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const logs = await storage.getDhikrLogs(userId, limit);
    res.json({ logs });
  } catch (error) {
    next(error);
  }
});

router.get("/logs/session/:sessionId", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const logs = await storage.getDhikrLogsBySession(req.params.sessionId, userId);
    res.json({ logs });
  } catch (error) {
    next(error);
  }
});

router.post("/logs", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const parsed = req.body;
    const log = await storage.createDhikrLog(userId, parsed);
    res.status(201).json({ log });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    next(error);
  }
});

router.get("/daily-azkar/:dateLocal", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const azkar = await storage.getDailyAzkar(userId, req.params.dateLocal);
    if (!azkar) {
      return res.status(404).json({ error: "Daily azkar not found" });
    }
    res.json({ azkar });
  } catch (error) {
    next(error);
  }
});

router.post("/daily-azkar", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const parsed = req.body;
    const azkar = await storage.upsertDailyAzkar(userId, parsed);
    res.json({ azkar });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    next(error);
  }
});

export default router;

