# AI Usage

## Tools Used

| Tool | Used? | How it was used |
| --- | --- | --- |
| Kiro | Yes | Main coding assistant for exploring the starter repository, drafting larger implementation changes, suggesting backend and frontend structure, and helping diagnose issues during development. |
| OpenAI Codex | Yes | Used for code generation, refactoring suggestions, implementation checks, and debugging focused tasks. |
| ChatGPT | Yes | Used for product-flow review, QA interaction design, visual/UI troubleshooting, documentation wording, and final submission preparation. |
| Cursor / GitHub Copilot | No | Not used for this submission. |

## Summary

AI was used extensively to accelerate implementation during the two-day challenge. I used it to investigate the starter repository, turn requirements into an implementation plan, generate first-pass code for individual features, explain errors, and review UI and workflow ideas.

AI did not act as an unattended code generator. I chose the scope and feature order, decided which suggestions were appropriate for this codebase, integrated the accepted changes, reviewed the affected files, and adjusted or rejected outputs that did not match the product requirements or the intended user experience. The final workspace is therefore AI-assisted, but the workflow design, trade-offs, acceptance criteria, and final implementation choices were managed by me.

## How I Worked With AI

My approach was iterative rather than asking for one large generated application:

1. I first inspected the starter project and identified the blank workspace route, existing authentication, score module, PostgreSQL service, and placeholder API area.
2. I used AI to propose a small end-to-end delivery path: work items first, then workflow validation, QA checks, releases, score events, and interface polish.
3. For each area, I reviewed the proposed structure against the challenge requirements and existing files before applying it.
4. I ran the application, inspected screens and API behaviour, then returned to the code to correct layout, workflow, and interaction issues.
5. I used AI again for focused fixes rather than treating the first output as final.

## Main Areas AI Helped With

- **Codebase investigation and planning:** Mapping the starter project and breaking the challenge into manageable vertical slices instead of trying to implement every feature at once.
- **Backend and database:** Drafting the PostgreSQL schema, NestJS DTOs, services, controllers, workflow transition checks, QA-readiness validation, release linking, deployment behaviour, and score-event idempotency ideas.
- **Frontend implementation:** Generating and refining the Kanban workspace structure, reusable UI components, drag-and-drop handling, work-item forms, filtering, detail views, comments, releases, theme support, and API integration.
- **QA and product behaviour:** Reviewing the QA workflow and improving it from a status-cycle interaction to explicit **Accept**, **Fail**, and **Retest** actions.
- **Debugging and polish:** Helping locate component/CSS issues, type errors, layout problems, and edge cases, then proposing focused changes to test.
- **Documentation:** Drafting the initial setup notes, decisions, AI disclosure, prompt log structure, testing notes, and known limitations for review and editing.

## What I Reviewed and Decided Manually

The following decisions were mine and were reviewed manually rather than accepted blindly from AI output:

- **Feature priorities:** I chose to complete a connected delivery flow — work item, QA, release readiness, release deployment, and score behaviour — before spending time on secondary enhancements.
- **Workflow rules:** I checked that only reasonable forward and backward status moves were available and that invalid shortcuts, such as moving an item directly to release, were blocked by backend logic.
- **QA release gate:** I required at least one QA check and required every check to pass before an item could move to `ready_for_release`.
- **QA interaction design:** I rejected the original cycle-through-status interaction because it could accidentally change an accepted test into a failed test. I changed the interaction to explicit **Accept** and **Fail** buttons, with **Retest** as the deliberate way to return a result to pending.
- **Data and API design:** I kept the module aligned with the existing stack and chose the raw SQL / `pg.Pool` approach rather than adding an ORM late in the challenge.
- **UI usability:** I reviewed spacing, hierarchy, dark-mode contrast, responsive behaviour, card density, and the clarity of workflow feedback. For example, I corrected the comment-avatar layout after a flex selector stretched a small initial badge into a wide oval.
- **Security and configuration:** I checked that runtime configuration is read from environment variables and that real `.env` files are not included in the submission.
- **Final review:** I reviewed generated code in context, adjusted naming and file organisation, and only kept features that worked with the existing project structure.

## Examples of AI Suggestions I Changed or Rejected

1. **QA status cycling was not safe enough.** An early UI approach used one clickable icon to cycle from pending to passed to failed. I changed this because a tester could alter a result unintentionally. The final interaction uses separate deliberate actions: Accept, Fail, and Retest.

2. **A generic CSS selector created an avatar bug.** A proposed layout rule gave the last `div` in a comment row `flex: 1`. In the rendered layout this stretched the initials avatar into a large oval. I replaced it with a selector that only expands the comment content and set a fixed square size for the avatar.

3. **Generated output still needed project-specific validation.** Some suggestions were structurally reasonable but required changes to match the actual component hierarchy, existing API types, and the submission scope. I treated generated code as a draft, not as an automatically correct solution.

## Verification and Commands

The application was developed and checked using the project commands below. Final command results are recorded separately in `TESTING.md`.

```bash
npm run install:all
docker compose up -d postgres
npm run dev:api
npm run dev:web
npm run build:api
npm run build:web
npm run test:api
npm run test:web
```

## Known Limitations

See `KNOWN_LIMITATIONS.md` for the remaining scope and test limitations.

## Prompt Log

Meaningful AI-assisted tasks, including the tools used and my manual review, are recorded in `PROMPT_LOG.md`.
