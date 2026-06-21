# Technical Decisions

## Summary

The project implements the challenge through Levels 1–5:

- **Level 1 — Core Work Items:** PostgreSQL persistence, authenticated CRUD, work-item board, create/edit/delete flows.
- **Level 2 — Workflow and Ownership:** backend transition rules, assignees, filters, My Work, comments, and board movement.
- **Level 3 — QA Checks:** QA records, explicit test results, progress, and release-readiness enforcement.
- **Level 4 — Release Notes:** create/view releases, link ready work items, and deploy releases.
- **Level 5 — Score, Tests, and Polish:** persistent score events with idempotency, workflow unit tests, responsive visual polish, and workflow health.

## Architecture

The repository remains split into two focused applications:

| Area | Responsibility |
| --- | --- |
| `frontend-next` | Next.js product UI, browser state, forms, filters, board interaction, and API calls. |
| `backend-nest` | NestJS REST API, validation, business rules, authenticated endpoints, and persistence access. |
| PostgreSQL | Persistent work items, QA checks, releases, release links, comments, and score events. |
| `docker-compose.yml` | Reproducible PostgreSQL 16 local environment. |

## Database design

### Raw SQL with `pg.Pool`

The starter already included the `pg` package and did not include an ORM. Using a shared `pg.Pool` and explicit SQL kept the solution small for the two-day challenge and avoided introducing an unnecessary migration framework or ORM dependency.

**Tradeoff:** SQL is more verbose and row mapping is not fully type-safe. A larger production application would benefit from typed query helpers or an ORM with migrations.

### Tables and relationships

| Table | Purpose | Important protection |
| --- | --- | --- |
| `work_items` | Feature, bug, improvement, and maintenance work. | Database `CHECK` constraints for status, type, and priority. |
| `qa_checks` | Tests attached to a work item. | Foreign key with `ON DELETE CASCADE`; `CHECK` constraint for pending/passed/failed. |
| `work_item_comments` | Discussion attached to a work item. | Foreign key with `ON DELETE CASCADE`; author name stored with the comment. |
| `release_notes` | Release metadata and deployment state. | Unique release version and deployment-status constraint. |
| `release_work_items` | Many-to-many link between releases and work items. | Composite primary key prevents duplicate links. |
| `score_events` | Persistent points awarded for delivery actions. | Unique partial index prevents duplicate score awards for the same user/action/entity. |

## API design

All workspace endpoints are protected by the existing JWT guard. The frontend improves usability by preventing obvious invalid actions, but the API remains the source of truth.

### Why status has a dedicated endpoint

`PATCH /it-workspace/work-items/:id/status` is separate from the general work-item update endpoint. Status transitions contain workflow rules and reward behavior; allowing a generic update to write a status would make bypasses easier.

### Why QA and release rules are checked in the service

Database constraints validate allowed values, but values alone cannot express rules such as “all QA checks must be passed before release readiness” or “only ready work items can be linked to a release.” These rules are enforced in `ItWorkspaceService` before the database update.

### Why release deployment is a controlled action

Deploying a release is a domain action, not a normal edit. The deployment endpoint changes the release state, changes every linked work item to `released`, and awards the release score event only once.

## Frontend design

### Kanban as the main workspace

The delivery lifecycle is naturally status-based, so the primary screen is a six-column Kanban board. It lets a reviewer see work distribution and workflow bottlenecks without navigating through separate tables.

The board is supported by:

- a quick create button and per-column add actions;
- direct editing and deletion confirmation;
- status, priority, assignee, text, and My Work filters;
- loading, empty, and error feedback;
- a detailed work-item panel for metadata, assignees, comments, and QA;
- responsive behavior for smaller screens.

### Workflow Health as the creative feature

The workflow-health panel is the creative feature. It summarizes readiness and delivery flow so a team can notice blocked work or a release bottleneck. It was chosen because it helps engineering decisions rather than only decorating the page.

### Explicit QA decisions, not status cycling

Each pending QA check gives the tester a clear **Pass** or **Fail** action. Once a result is recorded, the check displays the outcome and a deliberate **Retest** action.

This avoids a confusing cycle such as:

```text
pending → passed → failed → pending
```

The whole work item is considered ready only when every QA check is passed. “Accepted” therefore belongs to the release-readiness decision for the work item, not to one individual test result.

### Avatar layout and dark mode

Initials avatars use fixed dimensions and a visible dark-mode background/border. A previous broad layout selector risked stretching an avatar into an oval; the final style limits flex growth to comment content and keeps the avatar fixed and circular.

## Workflow rules

### Allowed transitions

```text
backlog → planned
planned → in_progress | backlog
in_progress → qa | planned
qa → ready_for_release | in_progress
ready_for_release → qa
released → no transitions
```

Backward transitions are intentionally limited to real engineering scenarios: a developer can return from QA to fix a failed check, and a release-ready item can return to QA when release validation finds an issue.

### QA readiness gate

A move from `qa` to `ready_for_release` is blocked when:

- no QA checks exist; or
- one or more QA checks are pending or failed.

This rule is enforced by the backend service and is not merely a frontend message.

### Release deployment rule

- Only `ready_for_release` work items can be linked to a release.
- A deployed release updates all linked work items to `released`.
- Deploying an already deployed release is blocked.

### Score idempotency

Score events use a unique index on `(user_id, action, entity_id)`. Repeating the same scored action for the same entity does not create duplicate points.

## Tradeoffs

| Decision | Benefit | Tradeoff |
| --- | --- | --- |
| Raw SQL instead of ORM | Fast, explicit, and aligned with the starter dependencies. | Less type safety and more manual row mapping. |
| Seeded single user | Keeps focus on delivery workflow in a short challenge. | No registration, user administration, or real team directory. |
| Compact QA UI | Fast, direct pass/fail testing flow. | Does not yet expose every QA metadata field in the UI. |
| Unit tests on workflow rules first | Protects the highest-risk business rules in limited time. | No browser end-to-end suite yet. |
| Simulated release deployment | Demonstrates release state changes and cascades without external infrastructure. | No CI/CD provider or rollback automation. |

## Next steps with more time

1. Add expected result, actual result, tester, and notes fields to the QA form and display them in the detail panel.
2. Add unit tests for QA readiness, release linking, deployment cascading, and score idempotency with database mocks or a temporary PostgreSQL test database.
3. Add frontend component tests and end-to-end browser tests for login, work-item creation, QA blocking, and release deployment.
4. Replace the seeded account with real user management, roles, and a directory-backed assignee selector.
5. Add activity history, notifications, release rollback behavior, and CI/CD integration.
