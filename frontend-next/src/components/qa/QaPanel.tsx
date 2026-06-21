"use client";

// QA checks panel shown inside the work item detail drawer.
// Shows progress bar, check list, and add/toggle/delete controls.

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Icon from "@/components/ui/Icon";
import type { QaCheck, QaStatus } from "@/lib/types";

interface QaPanelProps {
  workItemId: string;
}

export default function QaPanel({ workItemId }: QaPanelProps) {
  const [checks, setChecks] = useState<QaCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .qaChecks(workItemId)
      .then((data) => {
        if (active) setChecks(data);
      })
      .catch((e) => {
        if (active)
          setError(e instanceof Error ? e.message : "Failed to load QA checks");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [workItemId]);

  const passed = checks.filter((c) => c.status === "passed").length;
  const pct = checks.length ? Math.round((passed / checks.length) * 100) : 0;

  async function addCheck() {
    if (!newTitle.trim()) return;
    setSaving(true);
    try {
      const check = await api.createQaCheck(workItemId, {
        testTitle: newTitle.trim(),
      });
      setChecks((prev) => [...prev, check]);
      setNewTitle("");
      setAdding(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add check");
    } finally {
      setSaving(false);
    }
  }

  async function setQaStatus(check: QaCheck, newStatus: QaStatus) {
    try {
      const updated = await api.updateQaCheck(check.id, { status: newStatus });
      setChecks((prev) =>
        prev.map((item) => (item.id === check.id ? updated : item)),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update check");
    }
  }

  async function removeCheck(id: string) {
    try {
      await api.deleteQaCheck(id);
      setChecks((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete check");
    }
  }

  if (loading)
    return <div className="qa-panel__loading">Loading QA checks…</div>;

  return (
    <div className="qa-panel">
      <div className="qa-panel__header">
        <h3>QA Checks</h3>
        <span className="qa-panel__count">
          {passed}/{checks.length} passed
        </span>
      </div>

      {checks.length > 0 && (
        <div className="qa-panel__progress">
          <div className="qa-panel__progress-bar">
            <div
              className="qa-panel__progress-fill"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span>{pct}%</span>
        </div>
      )}

      {error && <p className="error">{error}</p>}

      <ul className="qa-panel__list">
        {checks.map((check) => (
          <li key={check.id} className={`qa-check qa-check--${check.status}`}>
            <div className="qa-check__result">
              {check.status === "pending" && (
                <>
                  <button
                    className="qa-check__accept"
                    onClick={() => setQaStatus(check, "passed")}
                    aria-label={`Accept ${check.testTitle}`}
                  >
                    <Icon name="check-circle" size={14} />
                    Accept
                  </button>

                  <button
                    className="qa-check__fail"
                    onClick={() => setQaStatus(check, "failed")}
                    aria-label={`Fail ${check.testTitle}`}
                  >
                    <Icon name="alert-circle" size={14} />
                    Fail
                  </button>
                </>
              )}

              {check.status === "passed" && (
                <>
                  <span className="qa-check__accepted">
                    <Icon name="check-circle" size={16} />
                    Accepted
                  </span>

                  <button
                    className="qa-check__retest"
                    onClick={() => setQaStatus(check, "pending")}
                  >
                    Retest
                  </button>
                </>
              )}

              {check.status === "failed" && (
                <>
                  <span className="qa-check__failed-result">
                    <Icon name="alert-circle" size={16} />
                    Failed
                  </span>

                  <button
                    className="qa-check__retest"
                    onClick={() => setQaStatus(check, "pending")}
                  >
                    Retest
                  </button>
                </>
              )}
            </div>
            <span className="qa-check__title">{check.testTitle}</span>
            <button
              className="qa-check__delete"
              onClick={() => removeCheck(check.id)}
              aria-label={`Delete ${check.testTitle}`}
            >
              <Icon name="x" size={12} />
            </button>
          </li>
        ))}
      </ul>

      {adding ? (
        <div className="qa-panel__add-form">
          <input
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addCheck();
              if (e.key === "Escape") setAdding(false);
            }}
            placeholder="Test title…"
          />
          <button
            className="button"
            onClick={addCheck}
            disabled={saving || !newTitle.trim()}
          >
            {saving ? "…" : "Add"}
          </button>
          <button className="button secondary" onClick={() => setAdding(false)}>
            Cancel
          </button>
        </div>
      ) : (
        <button className="qa-panel__add-btn" onClick={() => setAdding(true)}>
          <Icon name="plus" size={14} /> Add QA check
        </button>
      )}
    </div>
  );
}
