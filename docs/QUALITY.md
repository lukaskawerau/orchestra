---
summary: Quality bar and current gaps for Orchestra MVP
read_when:
  - deciding what is required before shipping MVP
  - evaluating current implementation risk
  - defining audit and execution acceptance criteria
---

# Quality

Quality here is not just "tests pass".
For Orchestra, quality means:
- Symphony runs are predictable
- cross-project control works
- artifacts are visible
- repo audits produce useful guidance

## Quality Bars

### A

Production-ready:
- behavior documented
- happy path and failure path tested
- artifacts visible in UI or persisted storage
- clear recovery story

### B

Usable but incomplete:
- core path works
- known gaps documented
- some automation coverage
- rough edges remain

### C

Prototype:
- behavior partly implemented
- limited proof
- likely edge-case failures

### D

Planned or misleading:
- docs say it exists but system cannot prove it

## Current Domain Status

| Domain | Grade | Why |
|--------|-------|-----|
| Symphony integration | D | Boundary not implemented yet; docs and code still mixed with native-runner assumptions |
| Multi-project scheduling | C | Basic orchestrator skeleton exists, but no real execution loop |
| Workflow parsing/config | C | Symphony-facing `WORKFLOW.md` frontmatter parsing exists for workspace root + typed workspace hooks, but broader run-path integration is still incomplete |
| Issue tracking | C | Linear-first for now; native tracker is target, not current reality |
| Dashboard/UI | C | Basic shell only |
| Run observability | C | Logger exists; end-to-end run artifacts do not |
| Harness-readiness audit | D | Key differentiator; not implemented yet |
| Self-hosted packaging | D | No real one-command deployment story yet |

## MVP Quality Requirements

Before calling the wrapper-first MVP real, these must be true:

1. Orchestra can register multiple repos and show them in one dashboard.
2. Orchestra can start and track a Symphony-backed run for a selected issue.
3. Orchestra persists run status, logs, and key artifacts.
4. Orchestra exposes enough evidence to debug a failed run without tailing random files by hand.
5. Orchestra can evaluate a repo and generate a useful first harness-hardening epic.
6. Local setup is documented and reproducible.

## Harness-Readiness Audit Bar

An audit feature is not good enough unless it checks at least:
- setup determinism
- test/validation speed and clarity
- docs and agent instructions
- architecture boundaries
- logging / observability
- repo entropy risks

And returns:
- findings
- evidence
- severity
- a recommended first epic

"This repo feels messy" is not a feature.

## Current Gaps

1. No real Symphony adapter boundary yet.
2. No proof that a run can move from issue selection to visible artifacts.
3. Workspace hook contract is now typed, but broader Orchestra-to-Symphony workflow coverage is still incomplete.
4. No repo audit engine.
5. Docs were ahead of implementation and partly pointed at the wrong architecture.

## Next Quality Milestones

1. [ ] Define and implement the Symphony adapter boundary.
2. [ ] Expand workflow parsing beyond workspace hooks and wire the parsed config through the full run path.
3. [ ] Build one end-to-end path: issue -> Symphony run -> logs/artifacts in Orchestra.
4. [ ] Implement a first repo audit that emits evidence-backed findings.
5. [ ] Turn audit output into a generated "first harness-hardening epic".
6. [ ] Add deployment path that matches the self-hosting promise.
