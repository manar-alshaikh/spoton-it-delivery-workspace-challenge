# AI Usage

## Tools Used

| Tool | Used? | Notes |
| --- | --- | --- |
| Kiro (Claude-based) | Yes | Primary tool for architecture, code generation, and documentation |
| ChatGPT | No | |
| Cursor | No | |

## Summary

Kiro was used as an active pair-programmer throughout the challenge. It generated code scaffolding, database schema, and documentation. All engineering decisions — what to build, in what order, and what tradeoffs to accept — were made by the developer. AI suggestions were reviewed, adjusted, and applied selectively.

## Main Areas AI Helped With

- **Architecture**: Suggested the raw SQL + `pg.Pool` approach given the absence of an ORM in the starter
- **Backend**: Generated controller/service scaffolding, DTOs, workflow transition logic, `VALID_TRANSITIONS` map, dynamic SQL `SET` clause builder for PATCH, and the `toWorkItem` row mapper
- **Frontend**: Generated page and form components matching the existing design system
- **Database**: Drafted the schema with constraints, FKs, and the score idempotency index
- **Documentation**: Generated initial DECISIONS.md and this file
- **Debugging**: Identified shell-specific issues (PowerShell redirection) during schema setup

## What Was Reviewed Manually

- Verified all schema constraints matched the README field requirements exactly
- Confirmed workflow transition rules matched the spec (including allowed backward moves)
- Checked that the JWT guard and `@CurrentUser()` decorator were already wired correctly before adding any auth logic
- Reviewed DB connection setup to ensure `DATABASE_URL` was read from env, not hardcoded
- Verified the score idempotency index covered the right columns
- Caught a TypeScript compile error in the service — `item.status` typed as `unknown` from the DB row, needed explicit cast. Fixed before the build passed.
- Decided to add the QA readiness gate directly inside `transitionStatus` at this stage — AI generated it inline, the decision to include it early was a deliberate engineering call to avoid revisiting the same method later.

## What AI Got Wrong

- Initially suggested using `docker exec ... psql -f -` with stdin redirection, which doesn't work in PowerShell. Had to switch to `docker cp` + `docker exec psql -f /tmp/schema.sql`.
- Service initially returned `item.status` as `unknown` from the raw DB row, causing a TypeScript error when passed to `validateTransition`. Required a cast — a proper typed row interface would have caught this at design time.

## Commands Run

```bash
npm run install:all
docker compose up -d postgres
docker cp backend-nest/src/database/schema.sql <container>:/tmp/schema.sql
docker exec <container> psql -U postgres -d spoton_challenge -f /tmp/schema.sql
npm run dev:api
npm run dev:web
```

## Known Limitations

_(Update at submission time with any incomplete levels or untested areas)_

## Prompt Log

See `PROMPT_LOG.md`.
