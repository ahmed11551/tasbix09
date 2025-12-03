// Re-export Prisma storage as the main storage
// This file exists for backward compatibility
// All routes import from "../storage" which points to PrismaStorage

import { storage as prismaStorage } from "./storage-prisma";
export const storage = prismaStorage;
