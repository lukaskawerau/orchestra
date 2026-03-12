# Design Principles

These are non-negotiable. If you're unsure, default to these.

## 1. Self-Hosting First

Orchestra must run with a single `docker compose up`. No external dependencies.
- SQLite, not Postgres
- Built-in issue tracking, not Linear
- Local git, not GitHub API (for core functionality)

## 2. Multi-Project Native

Unlike Symphony (single project), Orchestra manages many repos from one place.
- Project registry with per-project config
- Unified run queue with fair scheduling
- Dashboard shows all projects at once

## 3. Agent-First UX

The UI exists for humans, but the architecture serves agents.
- Structured logs that agents can query
- Predictable file layout
- Minimal magic, maximum explicitness

## 4. Parse at Boundaries

Every external input is validated immediately.
```typescript
// ✅ Good
const input = issueSchema.parse(req.body);

// ❌ Bad
const input = req.body as Issue;
```

## 5. Errors Are Data

Don't throw and pray. Return typed errors.
```typescript
// ✅ Good
type Result<T> = { ok: true; data: T } | { ok: false; error: string };

// ❌ Bad
throw new Error("something went wrong");
```

## 6. Test the Boundaries

Focus tests on:
- Schema validation
- State transitions (orchestrator)
- Protocol compliance (agent runner)

Don't obsess over testing pure functions — TypeScript already checks those.

## 7. Logs Are for Agents

Structured JSON logging (pino). Every log line must be parseable.
Include: timestamp, level, component, message, and relevant IDs.

```typescript
log.info({ projectId, issueId, runId }, "Run started");
```

## 8. Boring Technology

Prefer well-known, stable libraries:
- Drizzle (SQL)
- Zod (validation)
- Pino (logging)
- SvelteKit (framework)

Avoid: bleeding-edge ORMs, exotic state managers, "clever" abstractions.

## 9. Orchestra Builds Orchestra

This repo uses itself. Issues here are tracked in Orchestra.
If something is painful for agents, fix it in the product.
