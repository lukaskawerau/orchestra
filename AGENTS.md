# AGENTS.md — Orchestra

This is your map. Follow it.

## What is Orchestra?

Multi-project AI agent orchestrator. Self-hosted, built-in issue tracking, web dashboard.
Think Symphony, but for indie hackers with multiple repos.

## Repository Structure

```
docs/           → Design docs, architecture, execution plans
src/lib/        → Core library code (orchestrator, db, agent runner)
src/routes/     → SvelteKit routes (UI + API)
tests/          → Vitest tests (aim for 80%+ coverage)
drizzle/        → Database migrations
```

## Before You Code

1. Read `docs/ARCHITECTURE.md` — understand the layers
2. Read `docs/DESIGN.md` — understand the principles
3. Check `docs/plans/` — see if there's an active execution plan

## Core Principles

- **Parse at boundaries** — use Zod schemas, validate all external input
- **Strict types** — TypeScript strict mode, no `any`
- **Test everything** — write tests alongside code
- **Logs are for agents** — structured JSON, queryable

## Commands

```bash
pnpm dev          # Start dev server
pnpm test         # Run tests
pnpm ci           # Full CI check (fmt, lint, typecheck, test)
pnpm db:studio    # Open Drizzle Studio
```

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/db/schema.ts` | Database schema (Drizzle) |
| `src/lib/orchestrator/index.ts` | Core dispatch logic |
| `src/lib/agent/runner.ts` | Codex/Claude Code protocol |
| `src/lib/workspace/manager.ts` | Git worktree lifecycle |

## When Stuck

1. Run `pnpm test` — does it pass?
2. Run `pnpm ci` — what fails?
3. Check `docs/DESIGN.md` for guidance
4. If truly blocked, note it in the PR description
