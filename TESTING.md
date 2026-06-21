# Testing and Verification

## Automated tests added

The backend includes a focused Jest unit-test suite:

```text
backend-nest/src/it-workspace/it-workspace.service.spec.ts
```

It verifies the workflow transition rules in `ItWorkspaceService` and the shared `VALID_TRANSITIONS` map.

### Covered behavior

- All permitted forward transitions are accepted.
- Permitted backward transitions are accepted.
- Invalid shortcuts, such as Backlog directly to Released, are rejected.
- Released items have no allowed outgoing transitions.
- Every required workflow status exists in the transition map.

## Verified backend commands

The following checks were run in a clean backend install on 2026-06-21:

```bash
cd backend-nest
npm ci
npm run test
```

Result:

```text
Test Suites: 1 passed, 1 total
Tests:       15 passed, 15 total
```

A TypeScript compile check also passed:

```bash
cd backend-nest
npx tsc -p tsconfig.build.json --pretty false
```

## Commands to repeat before final push

Run these from the repository root after you copy the final files and make the final commit:

```bash
npm run install:all
docker compose up -d postgres
npm run test:api
npm run build:api
npm run build:web
```

Start the application in two terminals:

```bash
npm run dev:api
npm run dev:web
```

## Manual acceptance checks

Use the seeded account and check the following in the browser:

| Area | Check | Expected result |
| --- | --- | --- |
| Login | Sign in with the supplied assessment account. | The user enters the IT Workspace. |
| Work items | Create a feature with title, description, priority, assignee, and due date. | It persists and appears in Backlog. |
| Workflow | Move an item through Backlog → Planned → In Progress → QA. | Each allowed move succeeds. |
| Invalid workflow | Try an invalid shortcut, such as Backlog → Released. | The API rejects the move and the UI shows an error. |
| Filters | Search by title and filter by priority/assignee. | The board updates to show matching items. |
| QA block | In QA, try moving an item to Ready for Release before it has QA checks. | The move is blocked. |
| QA fail | Add a check and mark it Failed. | The item cannot move to Ready for Release. |
| QA pass | Retest and mark every QA check Passed. | The item can move to Ready for Release. |
| Releases | Create a release and link a ready work item. | The ready work item can be linked. |
| Deployment | Deploy the release. | Linked work items change to Released. |
| Score | Complete scored actions such as creating an item, moving to QA, reaching release readiness, and deploying a release. | Score events appear without duplicate points for the same event/entity. |
| Comments | Add a comment in the work-item details panel. | It persists, shows author initials, and remains readable in dark mode. |
| Theme | Switch between light and dark mode. | Layout, text, initials avatars, and controls remain readable. |

## Current automated-test scope

The submitted automated suite focuses on backend workflow transition rules. The QA readiness rule, release cascade, score idempotency, and frontend interactions are covered by manual acceptance checks but do not yet have dedicated automated tests. This is recorded as a limitation rather than presented as completed coverage.
