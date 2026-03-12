# Architecture

Orchestra is a SvelteKit application with a SQLite backend.

## Layers

```
┌─────────────────────────────────────────────────────────┐
│                    Routes (src/routes/)                 │
│  SvelteKit pages and API endpoints                      │
│  - /projects         → Project management               │
│  - /projects/[id]    → Single project view              │
│  - /runs             → All active runs                  │
│  - /api/...          → REST/tRPC endpoints              │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                  Orchestrator (src/lib/orchestrator/)   │
│  Core scheduling and dispatch logic                     │
│  - Poll projects for eligible issues                    │
│  - Manage concurrency slots                             │
│  - Track run state (running/retry/completed)            │
│  - Handle failures and retries                          │
└─────────────────────────────────────────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
┌───────────────────┐ ┌───────────────┐ ┌───────────────────┐
│ Workspace Manager │ │ Agent Runner  │ │ Observability     │
│ (workspace/)      │ │ (agent/)      │ │ (observability/)  │
│                   │ │               │ │                   │
│ - Git worktrees   │ │ - Codex proto │ │ - Structured logs │
│ - Hooks lifecycle │ │ - Claude Code │ │ - Metrics         │
│ - Cleanup         │ │ - Stdio JSON  │ │ - Run history     │
└───────────────────┘ └───────────────┘ └───────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    Database (src/lib/db/)               │
│  SQLite via Drizzle ORM                                 │
│  - projects, issues, runs, logs                         │
│  - Single file, self-contained                          │
└─────────────────────────────────────────────────────────┘
```

## Key Concepts

### Project
A git repository that Orchestra manages. Has its own issues and config.

### Issue
A unit of work within a project. Created in Orchestra's built-in tracker.

### Run
One execution attempt for one issue. Lives in an isolated git worktree.

### Proof of Work
What the agent must provide: passing CI, tests, and optionally a walkthrough.

## Data Flow

1. User creates issue in Orchestra UI
2. Orchestrator polls, finds eligible issue
3. Workspace Manager creates git worktree
4. Agent Runner spawns Codex/Claude Code
5. Agent works, opens PR
6. CI runs, provides proof of work
7. Human reviews or auto-merges
8. Workspace cleaned up

## Boundaries

- **External input**: Always validated with Zod at API boundaries
- **Agent protocol**: JSON-RPC over stdio (Symphony-compatible)
- **Database**: All writes go through Drizzle, no raw SQL
