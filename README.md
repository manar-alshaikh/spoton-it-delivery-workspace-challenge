# SpotOn IT Delivery Workspace

A full-stack workspace for managing a software delivery flow from an idea through planning, development, QA, release readiness, and deployment.

## What is included

- Secure sign-in with the seeded assessment account and JWT-protected API routes.
- Work-item CRUD for features, bugs, improvements, and maintenance work.
- A six-column Kanban workflow: **Backlog → Planned → In Progress → QA → Ready for Release → Released**.
- Drag-and-drop workflow movement with backend validation of allowed transitions.
- Search, status, priority, assignee, and **My Work** filters.
- Work-item details, comments, assignee initials, due dates, editing, and deletion confirmation.
- QA checks linked to work items, with explicit pass/fail decisions and retesting.
- A QA readiness gate: a work item cannot move to **Ready for Release** until it has at least one QA check and every check is passed.
- Release notes that can link only ready work items. Deploying a release changes its linked work items to **Released**.
- Persistent score events with idempotency protection to prevent duplicate points.
- A workflow-health panel that surfaces delivery status and release readiness.
- Light and dark modes.

## Technology

| Area | Technology |
| --- | --- |
| Frontend | Next.js, React, TypeScript, `@dnd-kit` |
| Backend | NestJS, TypeScript, REST API |
| Database | PostgreSQL 16 via Docker Compose |
| Authentication | Seeded JWT-based assessment login |
| Tests | Jest unit tests for workflow transition rules |

## Requirements

- Node.js 20+ and npm
- Docker Desktop running
- Git (for cloning and submission)

## Local setup

### 1. Install dependencies

From the repository root:

```bash
npm run install:all
```

### 2. Start PostgreSQL

```bash
docker compose up -d postgres
```

Check that it is running:

```bash
docker compose ps
```

### 3. Create the database tables

**Windows PowerShell**

```powershell
$container = docker compose ps -q postgres
docker cp .\backend-nest\src\database\schema.sql "${container}:/tmp/schema.sql"
docker compose exec -T postgres psql -U postgres -d spoton_challenge -f /tmp/schema.sql
```

**macOS / Linux / Git Bash**

```bash
docker compose exec -T postgres psql -U postgres -d spoton_challenge < backend-nest/src/database/schema.sql
```

The script is safe to run more than once because it uses `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS`.

### 4. Start the API

Open a terminal in the repository root:

```bash
npm run dev:api
```

The API starts at `http://localhost:3001`.

### 5. Start the web application

Open a second terminal in the repository root:

```bash
npm run dev:web
```

Open `http://localhost:3000` in a browser.

### 6. Sign in

```text
Email:    intern@spoton.test
Password: intern123
```

## Optional environment values

The application has local defaults for the Docker database and API URL. The `.env.example` file documents optional overrides:

```text
DATABASE_URL=postgres://postgres:postgres@localhost:5432/spoton_challenge
JWT_SECRET=replace-with-a-local-development-secret
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

Do not commit a real `.env` file. Use `.env.example` only as a safe template.

## Workflow rules

The backend is the source of truth for these rules:

```text
backlog → planned
planned → in_progress | backlog
in_progress → qa | planned
qa → ready_for_release | in_progress
ready_for_release → qa
released → no further transitions
```

### QA acceptance rule

A work item can move from **QA** to **Ready for Release** only when:

1. At least one QA check exists; and
2. Every QA check is marked **Passed**.

A failed QA check should return the work item to **In Progress** for a fix. The tester can then select **Retest** and explicitly mark it passed or failed again.

### Release rule

Only work items with the status `ready_for_release` can be attached to a release. Deploying that release updates all linked work items to `released`.

## Tests and verification

See [TESTING.md](TESTING.md) for the automated test coverage, commands, results, and manual acceptance checks.

## Known limitations

See [KNOWN_LIMITATIONS.md](KNOWN_LIMITATIONS.md) for the remaining scope and suggested next steps.

## AI disclosure and engineering decisions

- [AI usage disclosure](AI_USAGE.md)
- [Prompt log](PROMPT_LOG.md)
- [Technical decisions](DECISIONS.md)

## Submission security check

Before pushing the final repository:

```bash
git status
git ls-files | grep -E '(^|/)\.env($|\.local|\.production|\.development)$'
```

The second command should produce no result. On Windows PowerShell, use:

```powershell
git ls-files | Select-String '(^|/)\.env($|\.local|\.production|\.development)$'
```

If a real `.env` file appears, remove it from Git tracking before pushing:

```bash
git rm --cached .env
```

The project `.gitignore` excludes `.env`, `.env.*`, `node_modules`, `.next`, `dist`, and coverage output while allowing `.env.example`.
