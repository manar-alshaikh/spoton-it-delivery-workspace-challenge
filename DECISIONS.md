# Technical Decisions

## Summary

Building the IT Delivery Workspace across Levels 1–5:
- Level 1: Work Items CRUD with PostgreSQL persistence
- Level 2: Workflow transition rules, assignee ownership, search/filters
- Level 3: QA Checks with release readiness rule
- Level 4: Release Notes with deployment cascade
- Level 5: Score integration, idempotency, tests, creative feature

---

## Database Design

### Approach
No ORM is included in the starter. The `pg` package is already installed, so raw SQL via a shared `pg.Pool` was the natural choice. Avoids adding a heavy dependency (TypeORM/Prisma) mid-challenge.

### Tables

| Table | Purpose |
|---|---|
| `work_items` | Core delivery items with status, type, priority, assignee |
| `qa_checks` | Per-item QA test records; all must pass before release readiness |
| `release_notes` | Release versions and deployment status |
| `release_work_items` | Join table linking ready work items to a release |
| `score_events` | Persistent scoring log; unique index prevents duplicate awards |

### Key Constraints
- `work_items.status` and `type`/`priority` use CHECK constraints to enforce valid enum values at the DB level
- `qa_checks.work_item_id` has `ON DELETE CASCADE` so deleting a work item removes its checks
- `release_work_items` uses a composite primary key to prevent duplicate links
- `score_events` has a unique index on `(user_id, action, entity_id)` to block double-awarding points for the same action on the same entity

### Schema file
`backend-nest/src/database/schema.sql` — run once with:
```bash
psql $DATABASE_URL -f backend-nest/src/database/schema.sql
```

---

## API Design

All endpoints are under `/it-workspace` and protected by `JwtAuthGuard`.

### Work Items

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/work-items` | Create a new work item |
| `GET` | `/work-items` | List all, with optional filters: `?status= ?priority= ?assignee= ?search= ?mine=true` |
| `GET` | `/work-items/:id` | Get a single work item |
| `PATCH` | `/work-items/:id` | Update fields (title, description, type, priority, assignee, dueDate) |
| `PATCH` | `/work-items/:id/status` | Transition status — enforces `VALID_TRANSITIONS` and QA gate |
| `DELETE` | `/work-items/:id` | Delete a work item |

**Why `PATCH /:id/status` is separate from `PATCH /:id`:**
Status transitions carry business rules (transition guard, QA readiness check). Separating them makes the intent explicit and prevents accidental status changes through a generic field update.

**Why `?mine=true` instead of a separate `/my-work` route:**
The filter approach keeps the API surface small. The frontend can pass `?mine=true` to get the current user's items without needing a dedicated endpoint.

---

## Frontend Design

_(Fill in as pages are built — kanban board, work item detail, QA checks, releases)_

---

## Workflow Rules

### Valid Work Item Transitions
```
backlog → planned
planned → in_progress | backlog
in_progress → qa | planned
qa → ready_for_release | in_progress
ready_for_release → qa
released → (none)
```

### QA Readiness Rule
A work item cannot transition to `ready_for_release` if:
- It has zero QA checks, OR
- Any QA check is `pending` or `failed`

Enforced in `ItWorkspaceService` before the DB update.

### Release Deployment Rule
- Only `ready_for_release` work items can be linked to a release
- Deploying a release sets all linked work items to `released`
- Deploying an already-`deployed` release is blocked (idempotency)

### Score Idempotency
The `score_events` table has a unique index on `(user_id, action, entity_id)`. Any attempt to insert a duplicate event is caught and ignored (no double points).

---

## Tradeoffs

- **Raw SQL over ORM**: Faster to start, avoids migration tooling setup cost. Tradeoff is more verbose queries and no type-safe schema.
- **Single seeded user**: Auth uses a hardcoded user from the starter. No user management was added — out of scope for the challenge.

---

## Unfinished Work

_(Fill in at submission time)_
