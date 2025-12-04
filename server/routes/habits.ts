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
    const habits = await storage.getHabits(userId);
    res.json({ habits });
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
    const habit = await storage.getHabit(req.params.id, userId);
    if (!habit) {
      return res.status(404).json({ error: "Habit not found" });
    }
    res.json({ habit });
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
    const parsed = req.body;
    const habit = await storage.createHabit(userId, parsed);
    res.status(201).json({ habit });
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
    const parsed = req.body;
    const habit = await storage.updateHabit(req.params.id, userId, parsed);
    res.json({ habit });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    if (error instanceof Error && error.message === "Habit not found") {
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
    await storage.deleteHabit(req.params.id, userId);
    res.json({ message: "Habit deleted successfully" });
  } catch (error) {
    next(error);
  }
});

export default router;

