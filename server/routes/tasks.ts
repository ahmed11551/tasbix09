import { Router } from "express";
import { storage } from "../storage";
import { requireAuth, getUserId } from "../middleware/auth";
import { z } from "zod";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const tasks = await storage.getTasks(userId);
    res.json({ tasks });
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
    const task = await storage.getTask(req.params.id, userId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json({ task });
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
    const parsed = req.body; // Validate in Prisma
    const task = await storage.createTask(userId, parsed);
    res.status(201).json({ task });
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
    const parsed = req.body; // Validate in Prisma
    const task = await storage.updateTask(req.params.id, userId, parsed);
    res.json({ task });
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
    await storage.deleteTask(req.params.id, userId);
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    next(error);
  }
});

export default router;

