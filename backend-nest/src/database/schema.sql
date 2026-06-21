-- ============================================================
-- SpotOn IT Delivery Workspace – Database Schema
-- Run this script once against the spoton_challenge database:
--   psql $DATABASE_URL -f src/database/schema.sql
-- ============================================================

-- ------------------------------------------------------------
-- work_items
-- Represents a software feature, bug, improvement, or
-- maintenance task moving through the delivery lifecycle.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS work_items (
  id            TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title         TEXT        NOT NULL,
  description   TEXT        NOT NULL DEFAULT '',
  type          TEXT        NOT NULL CHECK (type IN ('feature', 'bug', 'improvement', 'maintenance')),
  status        TEXT        NOT NULL DEFAULT 'backlog'
                            CHECK (status IN ('backlog', 'planned', 'in_progress', 'qa', 'ready_for_release', 'released')),
  priority      TEXT        NOT NULL DEFAULT 'medium'
                            CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assignee      TEXT,
  due_date      DATE,
  created_by    TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- qa_checks
-- Testing and quality control records linked to a work item.
-- A work item cannot reach ready_for_release unless all its
-- QA checks are passed (enforced in the service layer).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS qa_checks (
  id              TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  work_item_id    TEXT        NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,
  test_title      TEXT        NOT NULL,
  expected_result TEXT        NOT NULL DEFAULT '',
  actual_result   TEXT        NOT NULL DEFAULT '',
  status          TEXT        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'passed', 'failed')),
  tester          TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- release_notes
-- Represents a planned or deployed software release.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS release_notes (
  id                TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  version           TEXT        NOT NULL UNIQUE,
  release_date      DATE,
  summary           TEXT        NOT NULL DEFAULT '',
  deployment_status TEXT        NOT NULL DEFAULT 'draft'
                                CHECK (deployment_status IN ('draft', 'scheduled', 'deployed', 'rolled_back')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- release_work_items
-- Join table linking ready work items to a release.
-- Only work items with status = 'ready_for_release' can be
-- linked (enforced in the service layer).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS release_work_items (
  release_id    TEXT NOT NULL REFERENCES release_notes(id) ON DELETE CASCADE,
  work_item_id  TEXT NOT NULL REFERENCES work_items(id)    ON DELETE CASCADE,
  PRIMARY KEY (release_id, work_item_id)
);

-- ------------------------------------------------------------
-- score_events
-- Persists scoring actions so points survive API restarts
-- and duplicate awards can be prevented per entity.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS score_events (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id     TEXT        NOT NULL,
  action      TEXT        NOT NULL,
  entity_id   TEXT,                        -- work item / release / qa check that triggered the event
  points      INTEGER     NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prevent duplicate score events for the same user + action + entity.
CREATE UNIQUE INDEX IF NOT EXISTS uq_score_events_user_action_entity
  ON score_events (user_id, action, entity_id)
  WHERE entity_id IS NOT NULL;
