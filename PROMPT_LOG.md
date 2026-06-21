# Prompt Log

Meaningful AI-assisted steps recorded here. Minor autocomplete and one-liner suggestions are excluded.

---

## 2026-06-21 — Kiro

### Goal
Understand the full challenge scope, existing codebase, and plan the implementation order.

### Prompt
Read all existing source files (auth, score, it-workspace controllers/services, frontend pages, api.ts, package.json, docker-compose) and the README. Produce a grounded step-by-step plan based on what actually exists vs what needs to be built.

### Output Summary
Produced a detailed breakdown identifying: what was already complete (auth, JWT guard, score page, api.ts fetch wrapper, login page, app shell), what was a stub (it-workspace controller/service, frontend workspace page), and a prioritized 8-step build plan.

### Files Reviewed
- `backend-nest/src/auth/*`
- `backend-nest/src/common/*`
- `backend-nest/src/score/*`
- `backend-nest/src/it-workspace/*`
- `frontend-next/src/app/**`
- `frontend-next/src/lib/api.ts`
- `backend-nest/package.json`
- `docker-compose.yml`

### Manual Review
Confirmed the plan matched reality — particularly that `pg` was already installed (no ORM needed), the JWT guard was already usable as-is, and the score service was in-memory and would need DB persistence.

### Related Commit
N/A

---

## 2026-06-21 — Kiro

### Goal
Set up environment variables.

### Prompt
Copy `.env.example` to `.env` and fill in any missing values.

### Output Summary
Copied file as-is (all values already correct for local dev) and changed `JWT_SECRET` from the obvious placeholder `dev-secret-change-me` to something less trivial.

### Files Changed
- `.env` (created)

### Manual Review
Verified `DATABASE_URL` matched the `docker-compose.yml` Postgres config exactly. Confirmed `.env` is gitignored.

### Related Commit
N/A

---

## 2026-06-21 — Kiro

### Goal
Set up the PostgreSQL schema and shared DB connection.

### Prompt
Create `db.ts` (shared `pg.Pool`) and `schema.sql` with all required tables: `work_items`, `qa_checks`, `release_notes`, `release_work_items`, `score_events`. Use the README field specs exactly. Add constraints and a score idempotency index. Apply the schema to the running Docker Postgres instance.

### Output Summary
- Created `db.ts` with a single exported `Pool` reading from `DATABASE_URL`
- Created `schema.sql` with all 5 tables, CHECK constraints on enums, FK with CASCADE, composite PK on the join table, and a unique index on `score_events(user_id, action, entity_id)`
- Applied via `docker cp` + `docker exec psql` (stdin redirection not supported in PowerShell)

### Files Changed
- `backend-nest/src/database/db.ts`
- `backend-nest/src/database/schema.sql`
- `DECISIONS.md` (created)

### Manual Review
- Verified all column names and types matched README requirements
- Confirmed `ON DELETE CASCADE` on `qa_checks` is correct (QA checks are owned by work items)
- Confirmed the unique index columns cover the duplicate-score scenario
- Caught and fixed the PowerShell redirection issue during schema execution

### Related Commit
N/A
