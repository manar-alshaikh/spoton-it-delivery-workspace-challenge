# Prompt Log

This log records meaningful AI-assisted work. Prompts are faithful summaries rather than full transcripts, and do not include private configuration values.

## 2026-06-19 — Kiro

### Goal
Understand the starter repository and create an implementation plan that could be completed within the challenge time.

### Prompt
Review the Next.js, NestJS, and PostgreSQL starter project. Identify what already exists, what is only a placeholder, and propose an implementation order for a complete IT delivery workflow: work items, workflow rules, QA, releases, score events, tests, and polish.

### Output Summary
Kiro mapped the main folders and suggested a vertical-slice approach: database and core work-item CRUD first, then server-side workflow rules, QA readiness, releases, score handling, and UI polish.

### Files Changed
- `backend-nest/src/database/schema.sql`
- `backend-nest/src/it-workspace/*`
- `frontend-next/src/app/pm/it-workspace/page.tsx`
- `frontend-next/src/components/board/*`

### Manual Review
I used the phased approach, but kept the scope focused on a working connected flow rather than adding every possible enhancement. I checked that the plan matched the challenge requirements and the existing project structure.

### Related Commit
Database and core workspace implementation commits.

---

## 2026-06-19 — Kiro / OpenAI Codex

### Goal
Implement the backend foundation for work items and enforce workflow correctness in the API rather than trusting the frontend.

### Prompt
Draft a PostgreSQL schema and NestJS service/controller structure for work items, QA checks, releases, and score events. Include status-transition validation, a release-readiness rule requiring all QA checks to pass, and a way to prevent duplicate score awards.

### Output Summary
The tools proposed schema tables, DTOs, controller methods, service helpers, status-transition logic, and score-event uniqueness handling.

### Files Changed
- `backend-nest/src/database/db.ts`
- `backend-nest/src/database/schema.sql`
- `backend-nest/src/it-workspace/constants/workflow.ts`
- `backend-nest/src/it-workspace/dto/*`
- `backend-nest/src/it-workspace/it-workspace.controller.ts`
- `backend-nest/src/it-workspace/it-workspace.service.ts`
- `backend-nest/src/score/*`

### Manual Review
I verified allowed and blocked transitions against the task requirements. I kept the QA gate in the backend service so it cannot be bypassed by changing only the frontend. I reviewed the SQL and environment-variable usage before keeping the changes.

### Related Commit
`feat: implement work items CRUD with workflow transition enforcement`

---

## 2026-06-20 — Kiro / OpenAI Codex

### Goal
Build a practical workspace UI instead of a simple CRUD page.

### Prompt
Create a compact engineering workspace using the existing Next.js app: a six-stage Kanban board, work-item cards, create/edit form, filtering, My Work, item details, comments, QA progress, releases, score visibility, dark/light mode, and clear empty/loading/error states. Keep components separated by responsibility.

### Output Summary
The tools assisted with component scaffolding, TypeScript types, API client calls, drag-and-drop structure, and styling suggestions.

### Files Changed
- `frontend-next/src/app/pm/it-workspace/page.tsx`
- `frontend-next/src/components/board/*`
- `frontend-next/src/components/layout/*`
- `frontend-next/src/components/ui/*`
- `frontend-next/src/lib/*`
- `frontend-next/src/app/globals.css`

### Manual Review
I reviewed the board flow, adjusted the component boundaries, checked that visible UI states reflected backend rules, and refined spacing and contrast after testing the layout in dark mode.

### Related Commit
`feat: build kanban workspace UI with drag-and-drop and dark/light mode`

---

## 2026-06-21 — ChatGPT

### Goal
Improve the QA interaction so results cannot change accidentally.

### Prompt
Review the QA check interaction. The existing status icon cycles through pending, accepted, and failed. Suggest a clearer workflow that makes passing or failing a test intentional and supports retesting after a fix.

### Output Summary
ChatGPT recommended explicit result buttons instead of status cycling: **Accept** and **Fail** when pending, then **Retest** to deliberately return a completed result to pending.

### Files Changed
- `frontend-next/src/components/qa/QaPanel.tsx`
- `frontend-next/src/app/globals.css`

### Manual Review
I agreed that a cycle interaction was a usability and QA-logic problem. I selected the explicit-action approach, checked that the backend already accepts direct status updates, and kept the release gate dependent on all checks passing.

### Related Commit
Final UI/QA refinement commit.

---

## 2026-06-21 — ChatGPT

### Goal
Fix comment initials avatars so they remain small, circular, and readable in dark mode.

### Prompt
Review the comment row layout. The initials badge is too large and becomes an oval. Identify the CSS rule causing it and provide a small fixed circular avatar that does not consume unnecessary space.

### Output Summary
ChatGPT identified that a generic flex selector was expanding the wrong element and proposed a targeted content selector with fixed avatar dimensions.

### Files Changed
- `frontend-next/src/app/globals.css`

### Manual Review
I inspected the rendered result and confirmed the original selector was stretching the badge. I kept the fixed circle and adjusted the sizing to fit the compact comment layout.

### Related Commit
Final UI polish commit.

---

## 2026-06-21 — ChatGPT

### Goal
Prepare transparent submission documentation without hiding the use of AI.

### Prompt
Write clear submission notes that explain extensive AI assistance while showing the developer’s role in reviewing code, making product decisions, correcting mistakes, testing, and owning the final result.

### Output Summary
ChatGPT drafted the documentation structure, including AI usage, the prompt log, testing guidance, known limitations, and setup notes.

### Files Changed
- `AI_USAGE.md`
- `PROMPT_LOG.md`
- `DECISIONS.md`
- `TESTING.md`
- `KNOWN_LIMITATIONS.md`
- `README.md`

### Manual Review
I checked that the documentation matches the actual tools used — Kiro, OpenAI Codex, and ChatGPT — and that it does not claim AI output was accepted without review. I will update final command outcomes in `TESTING.md` after running them locally.

### Related Commit
Final documentation commit.
