---
tracker:
  kind: orchestra
  project: orchestra

polling:
  interval_ms: 30000

workspace:
  root: ./workspaces

hooks:
  after_create: |
    pnpm install
  before_run: |
    pnpm fmt:check && pnpm lint && pnpm check

agent:
  command: codex
  args: ["--approval-mode", "full-auto"]
  turn_timeout_ms: 3600000
  stall_timeout_ms: 300000
---

# Orchestra Development Workflow

You are working on Orchestra, a multi-project AI agent orchestrator.

## Context

- This is a SvelteKit application with SQLite backend
- Read AGENTS.md for repository navigation
- Read docs/DESIGN.md for core principles

## Your Task

{{issue.title}}

{{issue.description}}

## Requirements

1. All code must pass `pnpm ci` (format, lint, typecheck, test)
2. Add tests for any new functionality
3. Update documentation if changing public interfaces
4. Keep commits atomic and well-described

## When Done

1. Ensure all tests pass
2. Open a PR with a clear description
3. If CI fails, fix the issues before requesting review
