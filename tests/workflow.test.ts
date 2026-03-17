import { execFile } from "node:child_process";
import {
  access,
  mkdtemp,
  mkdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import { createWorkspace, removeWorkspace } from "$lib/workspace/manager";
import { loadWorkspaceConfig, parseWorkflowConfig } from "$lib/workflow-config";

const execFileAsync = promisify(execFile);

const tempDirs: string[] = [];

async function makeTempDir(prefix: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

async function initRepo(repoPath: string): Promise<void> {
  await execFileAsync("git", ["init"], { cwd: repoPath });
  await execFileAsync("git", ["config", "user.email", "codex@example.com"], {
    cwd: repoPath,
  });
  await execFileAsync("git", ["config", "user.name", "Codex"], {
    cwd: repoPath,
  });
  await writeFile(join(repoPath, "README.md"), "# test\n");
  await execFileAsync("git", ["add", "README.md"], { cwd: repoPath });
  await execFileAsync("git", ["commit", "-m", "Initial commit"], {
    cwd: repoPath,
  });
}

afterEach(async () => {
  await Promise.all(
    tempDirs
      .splice(0)
      .reverse()
      .map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

describe("Workflow config", () => {
  it("parses Symphony workspace config and maps supported hook names", () => {
    const config = parseWorkflowConfig(
      `---
workspace:
  root: ./workspaces
hooks:
  after_create: |
    set -e
    pnpm install
  before_remove: |
    printf done > cleanup.txt
  timeout_ms: 90000
---
Body
`,
      { baseDir: "/tmp/orchestra-repo", homeDir: "/home/tester" },
    );

    expect(config).toEqual({
      root: "/tmp/orchestra-repo/workspaces",
      hooks: {
        afterCreate: "set -e\npnpm install",
        beforeRemove: "printf done > cleanup.txt",
      },
      hookTimeoutMs: 90000,
    });
  });

  it("rejects unsupported hook config keys with a clear error", () => {
    expect(() =>
      parseWorkflowConfig(
        `---
workspace:
  root: ./workspaces
hooks:
  before_create: echo nope
---
`,
      ),
    ).toThrowError(
      "Unsupported workflow hook config key(s): before_create. Supported keys: after_create, before_run, after_run, before_remove, timeout_ms",
    );
  });

  it("rejects invalid hook timeouts", () => {
    expect(() =>
      parseWorkflowConfig(
        `---
workspace:
  root: ./workspaces
hooks:
  timeout_ms: nope
---
`,
      ),
    ).toThrowError("hooks.timeout_ms must be a positive integer");
  });

  it("rejects missing workspace.root", () => {
    expect(() =>
      parseWorkflowConfig(
        `---
hooks:
  after_create: echo ok
---
`,
      ),
    ).toThrowError(/workspace/i);
  });

  it("loads config from WORKFLOW.md and expands ~/", async () => {
    const sandbox = await makeTempDir("workflow-config-");
    const workflowPath = join(sandbox, "WORKFLOW.md");

    await writeFile(
      workflowPath,
      `---
workspace:
  root: ~/custom-workspaces
---
Body
`,
    );

    const config = await loadWorkspaceConfig(workflowPath, {
      homeDir: "/home/tester",
    });

    expect(config.root).toBe("/home/tester/custom-workspaces");
  });

  it("runs after_create and before_remove hooks from parsed config", async () => {
    const sandbox = await makeTempDir("workflow-hooks-");
    const repoPath = join(sandbox, "repo");
    const workspaceRoot = join(sandbox, "workspaces");
    const beforeRemoveMarker = join(sandbox, "before-remove.txt");
    const workflowPath = join(repoPath, "WORKFLOW.md");

    await mkdir(repoPath, { recursive: true });
    await initRepo(repoPath);
    await writeFile(
      workflowPath,
      `---
workspace:
  root: ${workspaceRoot}
hooks:
  after_create: |
    printf created > after-create.txt
  before_remove: |
    printf removed > '${beforeRemoveMarker}'
---
Body
`,
    );

    const config = await loadWorkspaceConfig(workflowPath);
    const workspace = await createWorkspace(
      repoPath,
      "EMP-5",
      "emp-5-worktree",
      config,
    );

    expect(
      await readFile(join(workspace.path, "after-create.txt"), "utf8"),
    ).toBe("created");

    await removeWorkspace(repoPath, workspace.path, config);

    expect(await readFile(beforeRemoveMarker, "utf8")).toBe("removed");
    await expect(access(workspace.path)).rejects.toMatchObject({
      code: "ENOENT",
    });
  });
});
