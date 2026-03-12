# Orchestra 🎼

Multi-project AI agent orchestrator. Self-hosted Symphony for indie hackers.

> ⚠️ **STATUS: Vaporware** ⚠️
> 
> This is a freshly scaffolded project. It does not work yet. None of the features below exist.
> Follow along as we build it: [Execution Plan](./docs/plans/001-mvp.md)

## What is this?

Orchestra manages AI coding agents across multiple repositories from a single dashboard.
Unlike [OpenAI Symphony](https://github.com/openai/symphony), Orchestra:

- Works with **multiple projects** from one control plane
- Has **built-in issue tracking** (no Linear required)
- Ships with a **web dashboard** (not just CLI)
- Is **fully self-hosted** (single Docker command)

## Quick Start

```bash
# Clone and install
git clone https://github.com/lukaskawerau/orchestra
cd orchestra
pnpm install

# Set up database
pnpm db:migrate

# Start dev server
pnpm dev
```

Open http://localhost:5173

## Architecture

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for the full picture.

```
┌─────────────────────────────────────────────────────────┐
│                       Dashboard                         │
│  Projects • Issues • Runs • Logs                        │
├─────────────────────────────────────────────────────────┤
│                     Orchestrator                        │
│  Poll • Dispatch • Retry • Reconcile                    │
├─────────────────────────────────────────────────────────┤
│  Workspace Manager  │  Agent Runner  │  Observability   │
│  (git worktrees)    │  (Codex/CC)    │  (logs/metrics)  │
├─────────────────────────────────────────────────────────┤
│                   SQLite (Drizzle)                      │
└─────────────────────────────────────────────────────────┘
```

## For AI Agents

See [AGENTS.md](./AGENTS.md) for how to work in this repo.

## Development

```bash
pnpm dev          # Start dev server
pnpm test         # Run tests
pnpm ci           # Full CI check
pnpm db:studio    # Open Drizzle Studio
```

## Deployment

```bash
docker compose up -d
```

## License

MIT
