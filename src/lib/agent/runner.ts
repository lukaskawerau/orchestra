/**
 * Agent Runner - Coding agent protocol
 *
 * Implements the Symphony-compatible JSON-RPC protocol over stdio
 * for communicating with Codex app-server and Claude Code.
 */

import { spawn, type ChildProcess } from "node:child_process";
import { createInterface } from "node:readline";
import { z } from "zod";
import { createLogger } from "$lib/observability";

const log = createLogger("agent");

// Agent events schema (Symphony-compatible)
const agentEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("thread.started"),
    threadId: z.string(),
  }),
  z.object({
    type: z.literal("turn.started"),
    turnId: z.string(),
  }),
  z.object({
    type: z.literal("turn.completed"),
    turnId: z.string(),
    tokensUsed: z.number().optional(),
  }),
  z.object({
    type: z.literal("turn.failed"),
    turnId: z.string(),
    error: z.string(),
  }),
  z.object({
    type: z.literal("thread.completed"),
    threadId: z.string(),
  }),
]);

export type AgentEvent = z.infer<typeof agentEventSchema>;

export interface AgentConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  turnTimeoutMs?: number;
  stallTimeoutMs?: number;
}

export interface AgentSession {
  process: ChildProcess;
  threadId: string | null;
  turnId: string | null;
  tokensUsed: number;
}

export async function startAgent(
  config: AgentConfig,
  workspacePath: string,
  prompt: string,
  onEvent: (event: AgentEvent) => void,
): Promise<AgentSession> {
  log.info(
    { command: config.command, workspace: workspacePath },
    "Starting agent",
  );

  const proc = spawn(config.command, config.args ?? [], {
    cwd: workspacePath,
    env: { ...process.env, ...config.env },
    stdio: ["pipe", "pipe", "pipe"],
  });

  const session: AgentSession = {
    process: proc,
    threadId: null,
    turnId: null,
    tokensUsed: 0,
  };

  // Read JSON-RPC responses from stdout
  const rl = createInterface({ input: proc.stdout! });
  rl.on("line", (line) => {
    try {
      const data = JSON.parse(line);
      const event = agentEventSchema.parse(data);

      if (event.type === "thread.started") {
        session.threadId = event.threadId;
      } else if (event.type === "turn.started") {
        session.turnId = event.turnId;
      } else if (event.type === "turn.completed" && event.tokensUsed) {
        session.tokensUsed += event.tokensUsed;
      }

      onEvent(event);
    } catch {
      log.debug({ line }, "Non-JSON line from agent");
    }
  });

  // Log stderr
  const stderrRl = createInterface({ input: proc.stderr! });
  stderrRl.on("line", (line) => {
    log.debug({ line }, "Agent stderr");
  });

  // Send initial prompt
  const startMessage = JSON.stringify({
    jsonrpc: "2.0",
    method: "thread.start",
    params: { prompt },
    id: 1,
  });
  proc.stdin!.write(startMessage + "\n");

  return session;
}

export function stopAgent(session: AgentSession): void {
  log.info({ threadId: session.threadId }, "Stopping agent");
  session.process.kill("SIGTERM");
}
