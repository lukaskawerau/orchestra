import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export function ensureDatabaseDirectory(databaseUrl: string): string {
  if (databaseUrl === ":memory:") {
    return databaseUrl;
  }

  mkdirSync(dirname(databaseUrl), { recursive: true });
  return databaseUrl;
}
