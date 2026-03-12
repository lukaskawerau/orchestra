import { describe, it, expect, beforeEach } from "vitest";
import { createOrchestrator } from "$lib/orchestrator";

describe("Orchestrator", () => {
  const config = {
    pollIntervalMs: 30000,
    maxGlobalConcurrency: 10,
  };

  it("creates orchestrator with initial state", () => {
    const orch = createOrchestrator(config);

    expect(orch.state.running.size).toBe(0);
    expect(orch.state.retryQueue.size).toBe(0);
    expect(orch.state.pollIntervalMs).toBe(30000);
  });

  it("respects global concurrency limit", () => {
    const orch = createOrchestrator({ ...config, maxGlobalConcurrency: 2 });

    // Simulate 2 running
    orch.state.running.set("issue-1", {
      runId: "run-1",
      issueId: "issue-1",
      projectId: "proj-1",
      startedAt: new Date(),
    });
    orch.state.running.set("issue-2", {
      runId: "run-2",
      issueId: "issue-2",
      projectId: "proj-1",
      startedAt: new Date(),
    });

    expect(orch.canDispatch("proj-1")).toBe(false);
  });

  it("allows dispatch when under limit", () => {
    const orch = createOrchestrator(config);

    expect(orch.canDispatch("proj-1")).toBe(true);
  });
});
