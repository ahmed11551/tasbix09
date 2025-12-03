// This file is kept for type compatibility but not used in production
// We use Prisma (db-prisma.ts) instead of Drizzle

/*
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });
*/

// Placeholder exports to avoid import errors
export const pool = {} as any;
export const db = {} as any;
