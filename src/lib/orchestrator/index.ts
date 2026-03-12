/**
 * Orchestrator - Core dispatch and scheduling logic
 *
 * Responsibilities:
 * - Poll projects for eligible issues
 * - Dispatch issues to available agent slots
 * - Track running/retry/completed state
 * - Handle failures with exponential backoff
 */

import { db, projects, issues, runs, type Issue, type Project } from "$db";
import { eq, and, inArray } from "drizzle-orm";
import { createLogger } from "$lib/observability";

const log = createLogger("orchestrator");

export interface OrchestratorConfig {
  pollIntervalMs: number;
  maxGlobalConcurrency: number;
}

export interface OrchestratorState {
  running: Map<string, RunningEntry>;
  retryQueue: Map<string, RetryEntry>;
  pollIntervalMs: number;
}

interface RunningEntry {
  runId: string;
  issueId: string;
  projectId: string;
  startedAt: Date;
}

interface RetryEntry {
  issueId: string;
  attempt: number;
  dueAt: Date;
  error: string | null;
}

const ACTIVE_STATES = ["todo", "in_progress"];
const TERMINAL_STATES = ["done", "cancelled"];

export function createOrchestrator(config: OrchestratorConfig) {
  const state: OrchestratorState = {
    running: new Map(),
    retryQueue: new Map(),
    pollIntervalMs: config.pollIntervalMs,
  };

  return {
    state,

    async getEligibleIssues(): Promise<Issue[]> {
      const enabledProjects = await db
        .select()
        .from(projects)
        .where(eq(projects.enabled, true));

      if (enabledProjects.length === 0) return [];

      const projectIds = enabledProjects.map((p) => p.id);
      const eligibleIssues = await db
        .select()
        .from(issues)
        .where(
          and(
            inArray(issues.projectId, projectIds),
            inArray(issues.state, ACTIVE_STATES)
          )
        )
        .orderBy(issues.priority, issues.createdAt);

      // Filter out already running issues
      return eligibleIssues.filter((issue) => !state.running.has(issue.id));
    },

    canDispatch(projectId: string): boolean {
      const runningForProject = [...state.running.values()].filter(
        (r) => r.projectId === projectId
      ).length;

      // TODO: Check per-project concurrency limits
      return (
        runningForProject < 2 && state.running.size < config.maxGlobalConcurrency
      );
    },

    async tick(): Promise<void> {
      log.info("Orchestrator tick");

      const eligible = await this.getEligibleIssues();
      log.info({ count: eligible.length }, "Found eligible issues");

      for (const issue of eligible) {
        if (!this.canDispatch(issue.projectId)) {
          log.debug({ issueId: issue.id }, "Skipping - at concurrency limit");
          continue;
        }

        // TODO: Actually dispatch to agent runner
        log.info({ issueId: issue.id, title: issue.title }, "Would dispatch issue");
      }
    },
  };
}
