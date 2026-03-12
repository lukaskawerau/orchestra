# Quality Grades

Track quality status per domain. Updated as we ship.

## Domains

| Domain | Grade | Coverage | Notes |
|--------|-------|----------|-------|
| Database | 🟡 B | - | Schema defined, needs migrations |
| Orchestrator | 🟡 B | 60% | Core logic in place, needs integration tests |
| Workspace | 🟡 B | 40% | Unit tests only, needs real git tests |
| Agent Runner | 🔴 C | 0% | Protocol defined, not tested |
| UI/Dashboard | 🔴 C | 0% | Skeleton only |
| Observability | 🟡 B | - | Logger set up, needs metrics |

## Grading Scale

- 🟢 **A** — Production ready, well tested, documented
- 🟡 **B** — Functional, some tests, may have gaps
- 🔴 **C** — Skeleton/WIP, minimal testing
- ⚫ **D** — Planned, not started

## Known Gaps

1. No end-to-end tests yet
2. Agent protocol not tested against real Codex
3. UI is placeholder only
4. No Docker setup yet
5. No migrations generated

## Next Quality Milestones

1. [ ] Generate and run initial DB migration
2. [ ] Integration test: orchestrator → workspace → (mock) agent
3. [ ] Test agent protocol against Codex app-server
4. [ ] Build real dashboard pages
5. [ ] Add Docker Compose for deployment
