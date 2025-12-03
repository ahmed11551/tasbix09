import type { Express } from "express";
import { createServer, type Server } from "http";
import authRoutes from "./routes/auth";
import habitsRoutes from "./routes/habits";
import tasksRoutes from "./routes/tasks";
import goalsRoutes from "./routes/goals";
import sessionsRoutes from "./routes/sessions";
import dhikrRoutes from "./routes/dhikr";
import statsRoutes from "./routes/stats";
import aiRoutes from "./routes/ai";
import telegramRoutes from "./routes/telegram";
import qazaRoutes from "./routes/qaza";
import badgesRoutes from "./routes/badges";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // API routes
  app.use("/api/auth", authRoutes);
  app.use("/api/habits", habitsRoutes);
  app.use("/api/tasks", tasksRoutes);
  app.use("/api/goals", goalsRoutes);
  app.use("/api/sessions", sessionsRoutes);
  app.use("/api/dhikr", dhikrRoutes);
  app.use("/api/stats", statsRoutes);
  app.use("/api/ai", aiRoutes);
  app.use("/api/telegram", telegramRoutes);
  app.use("/api/qaza", qazaRoutes);
  app.use("/api/badges", badgesRoutes);

  return httpServer;
}
