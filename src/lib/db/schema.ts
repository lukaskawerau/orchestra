import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// Projects - git repositories that Orchestra manages
export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(), // nanoid
  name: text("name").notNull(),
  repoPath: text("repo_path").notNull(), // local path to git repo
  workflowPath: text("workflow_path").default("WORKFLOW.md"),
  defaultBranch: text("default_branch").default("main"),
  maxConcurrentRuns: integer("max_concurrent_runs").default(2),
  enabled: integer("enabled", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// Issues - units of work within a project
export const issues = sqliteTable("issues", {
  id: text("id").primaryKey(), // nanoid
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  identifier: text("identifier").notNull(), // human-readable: ORCH-1
  title: text("title").notNull(),
  description: text("description"),
  state: text("state").notNull().default("todo"), // todo, in_progress, done, cancelled
  priority: integer("priority").default(0), // lower = higher priority
  labels: text("labels", { mode: "json" }).$type<string[]>().default([]),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// Runs - execution attempts for issues
export const runs = sqliteTable("runs", {
  id: text("id").primaryKey(), // nanoid
  issueId: text("issue_id")
    .notNull()
    .references(() => issues.id),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  attempt: integer("attempt").notNull().default(1),
  status: text("status").notNull().default("pending"), // pending, running, success, failed, cancelled
  workspacePath: text("workspace_path"),
  branchName: text("branch_name"),
  prUrl: text("pr_url"),
  ciStatus: text("ci_status"), // pending, success, failed
  errorMessage: text("error_message"),
  tokensUsed: integer("tokens_used").default(0),
  startedAt: integer("started_at", { mode: "timestamp" }),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// Run logs - structured log entries for each run
export const runLogs = sqliteTable("run_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  runId: text("run_id")
    .notNull()
    .references(() => runs.id),
  level: text("level").notNull(), // debug, info, warn, error
  component: text("component").notNull(), // orchestrator, agent, workspace, ci
  message: text("message").notNull(),
  metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>(),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
});

// Type exports
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Issue = typeof issues.$inferSelect;
export type NewIssue = typeof issues.$inferInsert;
export type Run = typeof runs.$inferSelect;
export type NewRun = typeof runs.$inferInsert;
export type RunLog = typeof runLogs.$inferSelect;
export type NewRunLog = typeof runLogs.$inferInsert;
