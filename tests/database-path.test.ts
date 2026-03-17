import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { ensureDatabaseDirectory } from "$lib/db/database-path";

const tempDirs: string[] = [];

async function makeTempDir(prefix: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(
    tempDirs
      .splice(0)
      .reverse()
      .map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

describe("ensureDatabaseDirectory", () => {
  it("creates the parent directory for a file-backed sqlite database", async () => {
    const sandbox = await makeTempDir("database-path-");
    const databasePath = join(sandbox, "data", "orchestra.db");

    expect(existsSync(join(sandbox, "data"))).toBe(false);

    expect(ensureDatabaseDirectory(databasePath)).toBe(databasePath);
    expect(existsSync(join(sandbox, "data"))).toBe(true);
  });

  it("leaves in-memory databases unchanged", () => {
    expect(ensureDatabaseDirectory(":memory:")).toBe(":memory:");
  });
});
