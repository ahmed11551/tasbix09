import { Router } from "express";
import { storage } from "../storage";
import { requireAuth, getUserId } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    // Get all data
    const [habits, tasks, goals, logs] = await Promise.all([
      storage.getHabits(userId),
      storage.getTasks(userId),
      storage.getGoals(userId),
      storage.getDhikrLogs(userId, 1000),
    ]);
    
    // Calculate stats
    const totalDhikrCount = logs.reduce((sum, log) => sum + log.delta, 0);
    const goalsCompleted = goals.filter(g => g.status === "completed").length;
    
    // Calculate current streak from habits
    const currentStreak = habits.length > 0
      ? Math.max(...habits.map(h => h.currentStreak), 0)
      : 0;
    
    // Today's count
    const today = new Date().toISOString().split("T")[0];
    const todayLogs = logs.filter(log => {
      const logDate = new Date(log.atTs).toISOString().split("T")[0];
      return logDate === today;
    });
    const todayCount = todayLogs.reduce((sum, log) => sum + log.delta, 0);
    
    res.json({
      stats: {
        totalDhikrCount,
        goalsCompleted,
        currentStreak,
        todayCount,
      },
      counts: {
        habits: habits.length,
        tasks: tasks.length,
        goals: goals.length,
        activeGoals: goals.filter(g => g.status === "active").length,
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;

