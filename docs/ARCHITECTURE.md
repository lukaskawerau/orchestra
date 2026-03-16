---
summary: System architecture for Orchestra as a Symphony control plane
read_when:
  - changing how runs are created, tracked, or cleaned up
  - deciding whether logic belongs in Orchestra or Symphony
  - adding repo audit or harness-readiness features
---

# Architecture

Orchestra is a control plane around Symphony, not a second Symphony implementation.

Phase 1 architecture:
- Symphony reference implementation executes work inside per-issue workspaces
- Orchestra coordinates many projects and many runs
- Orchestra adds dashboard, issue tracking, run history, and repo-readiness evaluation
- Orchestra stays self-hosted: one container, local storage, local Git access

Long term, Orchestra may replace more of Symphony's internals. Early on, that is the wrong fight.

## System Boundaries

### Orchestra owns

- Project registry
- Issue queue and prioritization
- Multi-project scheduling
- Run history and observability
- Review/dashboard UX
- Repo audit and harness-readiness scoring
- Packaging and self-hosting

### Symphony owns

- Single-run execution semantics
- Per-run workspace lifecycle
- Agent harness behavior
- Hook execution inside a workspace
- Agent process protocol and turn loop

### Temporary reality

Until Orchestra's built-in tracker is good enough, we can keep using Linear as the issue source of truth.
That is a migration stage, not the destination architecture.

## Layers

```text
┌──────────────────────────────────────────────────────────────┐
│                    Dashboard / API (SvelteKit)              │
│  projects • issues • runs • logs • audit findings           │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                 Orchestra Control Plane                      │
│  - project registry                                          │
│  - issue sync / local tracker                                │
│  - scheduler across repos                                    │
│  - run state machine                                         │
│  - artifact indexing                                         │
└──────────────────────────────────────────────────────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────────┐   ┌───────────────────────────┐
│   Symphony Runtime Adapter   │   │   Harness Readiness       │
│  - invoke Symphony runs      │   │   Evaluator               │
│  - pass workflow/config      │   │  - repo scan              │
│  - ingest hooks/artifacts    │   │  - scoring                │
│  - normalize run events      │   │  - first-epic generation  │
└──────────────────────────────┘   └───────────────────────────┘
               │                              │
               └──────────────┬───────────────┘
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                    Local Persistence                         │
│  SQLite via Drizzle                                          │
│  projects • issues • runs • logs • artifacts • audit scores  │
└──────────────────────────────────────────────────────────────┘
```

## Key Concepts

### Project

A repository Orchestra can supervise.

Project config includes:
- repo path / clone source
- execution backend config
- workflow file path
- policy defaults
- audit preferences

### Issue

A unit of work for a project.

Near term:
- may come from Linear

Target:
- native Orchestra issue

### Run

One execution attempt for one issue.

Run record stores:
- project + issue identity
- execution backend used
- timestamps and status
- artifacts, logs, validation output
- review and merge metadata

### Execution Backend

The engine that actually performs the coding run.

Phase 1:
- Symphony reference implementation

Future:
- Symphony-compatible native runner
- other backends if they are worth the complexity

### Harness Readiness Audit

An evaluation of how usable a repo is for agent-driven work.

Audit output should answer:
- how legible is this repo to an agent?
- how deterministic is local setup?
- how fast is the feedback loop?
- where are the sharp edges?
- what should the first hardening epic be?

### Artifact

Any durable output from a run or audit:
- logs
- diff summary
- test results
- screenshots
- audit report
- generated epic / remediation plan

## Primary Flows

### 1. Run execution

1. User selects a project and creates or syncs an issue
2. Orchestra decides the issue is eligible
3. Orchestra starts a run through the Symphony adapter
4. Symphony creates the per-issue workspace and executes hooks
5. Symphony runs the agent
6. Orchestra ingests status, logs, and artifacts
7. Orchestra shows review state in the dashboard

### 2. Repo readiness evaluation

1. User points Orchestra at a repo
2. Orchestra inspects docs, scripts, tests, repo shape, and setup ergonomics
3. Orchestra scores the repo against harness-readiness criteria
4. Orchestra generates findings plus a recommended first epic
5. User accepts that epic into the queue

## Architectural Constraints

### Wrapper first

Do not rebuild Symphony internals unless the control-plane boundary is clearly blocking product goals.

### Parse at boundaries

External input is untrusted:
- webhook payloads
- tracker data
- workflow files
- Symphony output
- audit findings from subprocesses

Validate all of it with explicit schemas.

### Local-first operations

Core use cases should work without GitHub API dependency.
GitHub integration is useful, not foundational.

### Artifacts over anecdotes

Every important claim in the dashboard should trace back to durable evidence:
- command output
- file diff
- structured log
- test result
- review event

### Repo-specific setup belongs in project workflow

Orchestra should not hardcode SvelteKit, Elixir, Rails, or Rust bootstrap rules in core logic.
Project workflow config should carry stack-specific setup.

## What We Are Not Doing Yet

- Replacing Symphony's runner loop
- Replacing Symphony's workspace semantics
- Building a full CI system
- Building deep GitHub-native workflow as a prerequisite

Those may come later. They are not MVP architecture.
