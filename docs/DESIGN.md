---
summary: Product and engineering principles for Orchestra
read_when:
  - defining product scope or roadmap
  - deciding between wrapping Symphony or reimplementing it
  - designing repo audit and harness-readiness features
---

# Design Principles

These are the defaults. Violating them needs a real reason.

## 1. Wrapper First, Rebuild Later

Orchestra should wrap Symphony before it attempts to replace Symphony.

Why:
- faster path to a useful product
- less protocol drift
- less maintenance debt
- lets us spend energy on the differentiator

Bad move:
- rebuilding runner/workspace internals because we can

Good move:
- using Symphony as the execution substrate while Orchestra owns the control plane

## 2. Differentiation Above the Runner

The product is not "another agent runner".
The product is:
- multi-project orchestration
- self-hosted dashboard
- tracker replacement over time
- run visibility
- repo evaluation for harness engineering

If a feature does not strengthen that layer, it is probably not MVP-critical.

## 3. Harness Engineering Is a Product Surface

Orchestra should help users make repos easier for agents to work in.

Audit dimensions should include:
- agent legibility
- deterministic setup
- fast local validation
- explicit architecture boundaries
- good docs and workflow clarity
- structured logs and observable failures
- cleanup and entropy control

Output must be actionable:
- concrete findings
- severity / impact
- recommended first epic
- acceptance criteria for that epic

## 4. Self-Hosting First

Orchestra must be easy to stand up:
- one container or one `docker compose up`
- local database
- local filesystem access
- minimal required secrets

External SaaS integrations can help, but core value should not depend on them.

## 5. Multi-Project Native

This is where Orchestra stops being "Symphony plus chrome".

Must support:
- many repos
- many queues
- fair scheduling
- per-project workflow config
- cross-project visibility from one dashboard

Single-project assumptions are bugs.

## 6. Temporary Integrations Are Fine

Using Linear now is acceptable.
Pretending temporary integrations are permanent architecture is not.

Rule:
- near-term pragmatism is fine
- docs must say what is temporary and what is target state

## 7. Parse at Boundaries

Never trust:
- workflow frontmatter
- tracker payloads
- subprocess output
- agent events
- audit command output

Validate immediately.

```typescript
const config = workflowSchema.parse(rawConfig);
```

## 8. Errors Are Data

Agent systems fail in weird ways. If failures are opaque, the dashboard is useless.

Prefer:
- typed results
- structured failure reasons
- persisted artifacts
- explicit retry metadata

Avoid:
- silent fallbacks
- stringly-typed status blobs
- "unknown error" dead ends

## 9. Logs Are for Humans and Agents

Everything important should be inspectable by both:
- operators in the UI
- later automation

That means:
- structured JSON
- stable event names
- IDs on every relevant event
- command + exit code + duration where relevant

## 10. Fast Feedback Beats Cleverness

If a repo takes forever to validate, agent throughput collapses.

Prefer:
- cheap targeted tests
- deterministic bootstrap
- obvious scripts
- local proof before remote proof

Avoid:
- magical setup
- hidden mutable state
- "works on CI only" validation

## 11. Repo-Specific Policy, Not Global Guessing

Orchestra core should not guess how every stack works.

Project config should define:
- bootstrap hooks
- validation commands
- merge policy
- artifact collection

Core provides the framework. Projects provide the specifics.

## 12. Orchestra Should Eventually Build Orchestra

Target end state:
- Orchestra tracks Orchestra work
- Orchestra evaluates its own harness-readiness
- Orchestra exposes its own rough edges quickly

But "eventually" matters. First make the wrapper useful.
