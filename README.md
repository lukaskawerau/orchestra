# Orchestra 🎼

Orchestra is a self-hosted control plane for Symphony.

It is for people with multiple repos who want:
- one place to see agent work
- one queue across projects
- a dashboard for runs, logs, and artifacts
- a path away from Linear
- a way to evaluate whether a repo is actually ready for harness engineering

## Status

Early build. Real direction now:
- wrap Symphony first
- add Orchestra-specific control-plane value
- delay native runner replacement until it is justified

Execution plan: [docs/plans/001-mvp.md](./docs/plans/001-mvp.md)

## What Orchestra Does

Orchestra is not trying to beat Symphony at being Symphony.

Phase 1:
- register multiple repos
- track issues and runs across them
- start Symphony-backed runs
- persist logs and artifacts
- evaluate repos for harness-readiness
- generate the first hardening epic for brownfield codebases

## What Symphony Does

Symphony remains the execution engine:
- per-run workspace lifecycle
- agent execution loop
- hooks inside a workspace
- single-run semantics

Orchestra sits above that layer.

## Why This Exists

Symphony is strong at executing a run.
What is still missing for many teams:
- multi-project coordination
- a self-hosted dashboard
- integrated run visibility
- built-in issue tracking over time
- a practical answer to: "is this repo even ready for harness engineering?"

That is the product.

## Architecture

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md).

High level:

```text
┌──────────────────────────────────────────────────────────────┐
│                 Dashboard / API (SvelteKit)                 │
│  projects • issues • runs • logs • audit findings           │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                Orchestra Control Plane                       │
│  scheduling • project registry • run history • policies     │
└──────────────────────────────────────────────────────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────────┐   ┌───────────────────────────┐
│   Symphony Runtime Adapter   │   │   Harness Readiness       │
│                              │   │   Evaluator               │
└──────────────────────────────┘   └───────────────────────────┘
               │                              │
               └──────────────┬───────────────┘
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                    SQLite (Drizzle)                          │
└──────────────────────────────────────────────────────────────┘
```

## Quick Start

```bash
git clone https://github.com/lukaskawerau/orchestra
cd orchestra
pnpm install
mkdir -p data
pnpm db:migrate
pnpm dev
```

Open `http://localhost:5173`.

## Development

```bash
pnpm dev
pnpm test
pnpm ci
pnpm db:studio
```

## Docs

- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- [docs/DESIGN.md](./docs/DESIGN.md)
- [docs/QUALITY.md](./docs/QUALITY.md)
- [docs/plans/001-mvp.md](./docs/plans/001-mvp.md)

## For AI Agents

See [AGENTS.md](./AGENTS.md).

## Deployment

Target experience:

```bash
docker compose up
```

Not finished yet.

## License

MIT
