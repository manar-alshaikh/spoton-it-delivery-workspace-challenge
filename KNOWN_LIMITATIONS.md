# Known Limitations and Next Steps

The core delivery flow is implemented, but the following improvements remain outside the two-day challenge scope.

## 1. Authentication and users

The application uses the seeded assessment account supplied by the starter project. There is no registration flow, user administration, password reset, role-based permissions, or directory integration.

**Next step:** add real users, roles, and a searchable team directory for assignees and testers.

## 2. QA metadata UI

The database and API support expected result, actual result, tester, and notes for QA checks. The current compact QA interface focuses on a test title and an explicit Pass/Fail/Retest decision.

**Next step:** expose all QA fields in the UI and make them easy to review in the work-item detail panel.

## 3. Automated test coverage

The project includes 15 backend unit tests for valid and invalid workflow transitions. There are no automated browser tests, and the QA gate, release cascade, and score idempotency do not yet have dedicated automated test cases.

**Next step:** add service tests with database mocks or a temporary PostgreSQL database, component tests, and end-to-end tests with Playwright or Cypress.

## 4. Deployment integration

A release deployment updates release and work-item states inside the application. It does not trigger a real CI/CD pipeline, collect deployment logs, or support a true automated rollback.

**Next step:** integrate with GitHub Actions, GitLab CI, or another deployment provider and record deployment results.

## 5. Audit trail and notifications

Comments are available, but there is no full immutable history of every change and no notification system for assignments, failed QA, or deployment status.

**Next step:** add activity events, notification preferences, and in-app/email alerts.

## 6. Single workspace scale

The current solution is designed for one assessment workspace and a small number of work items. It does not include projects, teams, pagination, archival policies, or organisation-wide reporting.

**Next step:** introduce project boundaries, pagination, role-specific dashboards, and reporting exports.
