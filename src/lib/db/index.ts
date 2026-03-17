import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { ensureDatabaseDirectory } from "./database-path";
import * as schema from "./schema";

const sqlite = new Database(
  ensureDatabaseDirectory(process.env.DATABASE_URL ?? "./data/orchestra.db"),
);
export const db = drizzle(sqlite, { schema });

export * from "./schema";
