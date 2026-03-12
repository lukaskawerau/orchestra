/**
 * Workspace Manager - Git worktree lifecycle
 *
 * Responsibilities:
 * - Create isolated worktrees per issue
 * - Run lifecycle hooks (after_create, before_run, after_run)
 * - Clean up worktrees for terminal issues
 */

import { exec } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, rm, access } from "node:fs/promises";
import { join } from "node:path";
import { createLogger } from "$lib/observability";

const execAsync = promisify(exec);
const log = createLogger("workspace");

export interface WorkspaceConfig {
  root: string;
  hooks?: {
    afterCreate?: string;
    beforeRun?: string;
    afterRun?: string;
    beforeRemove?: string;
  };
  hookTimeoutMs?: number;
}

export interface Workspace {
  path: string;
  key: string;
  isNew: boolean;
}

/**
 * Sanitize issue identifier for use as directory name
 */
function sanitizeKey(identifier: string): string {
  return identifier.replace(/[^A-Za-z0-9._-]/g, "_");
}

export async function createWorkspace(
  repoPath: string,
  issueIdentifier: string,
  branchName: string,
  config: WorkspaceConfig
): Promise<Workspace> {
  const key = sanitizeKey(issueIdentifier);
  const workspacePath = join(config.root, key);

  let isNew = false;

  try {
    await access(workspacePath);
    log.info({ path: workspacePath }, "Workspace already exists");
  } catch {
    isNew = true;
    log.info({ path: workspacePath, branch: branchName }, "Creating workspace");

    await mkdir(config.root, { recursive: true });

    // Create git worktree
    await execAsync(
      `git worktree add -b ${branchName} ${workspacePath}`,
      { cwd: repoPath }
    );

    // Run after_create hook if defined
    if (config.hooks?.afterCreate) {
      log.info("Running after_create hook");
      await runHook(config.hooks.afterCreate, workspacePath, config.hookTimeoutMs);
    }
  }

  return { path: workspacePath, key, isNew };
}

export async function removeWorkspace(
  repoPath: string,
  workspacePath: string,
  config: WorkspaceConfig
): Promise<void> {
  log.info({ path: workspacePath }, "Removing workspace");

  // Run before_remove hook if defined
  if (config.hooks?.beforeRemove) {
    try {
      await runHook(config.hooks.beforeRemove, workspacePath, config.hookTimeoutMs);
    } catch (err) {
      log.warn({ err }, "before_remove hook failed, continuing cleanup");
    }
  }

  // Remove git worktree
  await execAsync(`git worktree remove --force ${workspacePath}`, { cwd: repoPath });
}

async function runHook(
  script: string,
  cwd: string,
  timeoutMs = 60000
): Promise<void> {
  await execAsync(script, {
    cwd,
    timeout: timeoutMs,
    shell: "/bin/bash",
  });
}
