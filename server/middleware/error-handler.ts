import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

export interface ApiError extends Error {
  status?: number;
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  err: ApiError | ZodError | Prisma.PrismaClientKnownRequestError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation error",
      details: err.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      })),
    });
  }

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002":
        return res.status(409).json({
          error: "Unique constraint violation",
          field: err.meta?.target,
        });
      case "P2025":
        return res.status(404).json({
          error: "Record not found",
        });
      case "P1001":
      case "P1002":
      case "P1003":
      case "P1008":
      case "P1017":
        // Database connection errors
        console.error("Database connection error:", err);
        return res.status(503).json({
          error: "Database connection failed",
          message: "Не удалось подключиться к базе данных. Проверьте DATABASE_URL.",
          code: err.code,
        });
      default:
        console.error("Prisma error:", err);
        return res.status(500).json({
          error: "Database error",
          code: err.code,
          message: process.env.NODE_ENV === 'development' ? err.message : undefined,
        });
    }
  }

  // Prisma initialization errors
  if (err instanceof Prisma.PrismaClientInitializationError) {
    console.error("Prisma initialization error:", err);
    return res.status(503).json({
      error: "Database initialization failed",
      message: "Не удалось инициализировать подключение к базе данных. Проверьте DATABASE_URL.",
      code: err.errorCode,
    });
  }

  // Custom API errors
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal server error";

  // Log unexpected errors
  if (status >= 500) {
    console.error("Server error:", err);
  }

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
    }),
  });
}

// Wrapper for async route handlers
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

