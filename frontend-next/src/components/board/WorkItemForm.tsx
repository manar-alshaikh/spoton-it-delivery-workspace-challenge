'use client';

// Modal form for creating and editing work items.
// Receives an optional `item` for edit mode; omit for create mode.

import { useState, useEffect, FormEvent } from 'react';
import { api } from '@/lib/api';
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue';
import type { WorkItem, WorkItemType, WorkItemPriority, WorkItemStatus } from '@/lib/types';

const TYPES      = ['feature', 'bug', 'improvement', 'maintenance'] as const;
const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;

interface WorkItemFormProps {
  item?: WorkItem | null;
  defaultStatus?: string;
  onSave:  (data: Partial<WorkItem>) => Promise<void>;
  onClose: () => void;
  assigneeOptions?: string[];
}

const TEAM_DIRECTORY = ['Aisha Clarke', 'Ethan Taylor', 'Jordan Cole', 'Maya Wong', 'Sam Patel'];

export default function WorkItemForm({
  item,
  defaultStatus = 'backlog',
  onSave,
  onClose,
  assigneeOptions = [],
}: WorkItemFormProps) {
  const [title,       setTitle]       = useState(item?.title ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [type,        setType]        = useState<WorkItemType>(item?.type ?? 'feature');
  const [priority,    setPriority]    = useState<WorkItemPriority>(item?.priority ?? 'medium');
  const [assignees,   setAssignees]   = useState(
    item?.assignee?.split(',').map((name) => name.trim()).filter(Boolean) ?? [],
  );
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [dueDate,     setDueDate]     = useState(item?.dueDate?.slice(0, 10) ?? '');
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');
  const [currentUser, setCurrentUser] = useState('');
  const [pickerOpen,  setPickerOpen]  = useState(false);
  const debouncedAssigneeSearch = useDebouncedValue(assigneeSearch, 250);

  useEffect(() => {
    api.me().then((user) => setCurrentUser(user.name)).catch(() => {});
  }, []);

  const people = debouncedAssigneeSearch.trim()
    ? Array.from(
        new Set([currentUser, ...assigneeOptions, ...TEAM_DIRECTORY].filter(Boolean)),
      ).filter((name) =>
        !assignees.includes(name) && name.toLowerCase().includes(debouncedAssigneeSearch.toLowerCase()),
      )
    : [];

  function addAssignee(name: string) {
    if (name && !assignees.includes(name)) setAssignees((current) => [...current, name]);
    setAssigneeSearch('');
    setPickerOpen(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave({
        title:       title.trim(),
        description: description.trim(),
        type,
        priority,
        assignee:    assignees.length ? assignees.join(', ') : undefined,
        dueDate:     dueDate || undefined,
        ...(!item && { status: defaultStatus as WorkItemStatus }),
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal__header">
          <h2>{item ? 'Edit Work Item' : 'New Work Item'}</h2>
          <button className="modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal__body">
          <div className="field">
            <label htmlFor="wi-title">Title *</label>
            <input
              id="wi-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Short, clear title"
              maxLength={200}
            />
          </div>

          <div className="field">
            <label htmlFor="wi-description">Description</label>
            <textarea
              id="wi-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What needs to be done?"
            />
          </div>

          <div className="form-row form-row--three">
            <div className="field">
              <label htmlFor="wi-type">Type</label>
              <select id="wi-type" value={type} onChange={(e) => setType(e.target.value as WorkItemType)}>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="field">
              <label htmlFor="wi-priority">Priority</label>
              <select id="wi-priority" value={priority} onChange={(e) => setPriority(e.target.value as WorkItemPriority)}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="field">
              <label htmlFor="wi-due">Due Date</label>
              <input
                id="wi-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="assignee-section">
            <div className="field">
              <label htmlFor="wi-assignee">Add assignees</label>
              <div
                className="assignee-picker"
                onFocus={() => setPickerOpen(true)}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                    setPickerOpen(false);
                  }
                }}
              >
                <div className="assignee-picker__input-row">
                  <input
                    id="wi-assignee"
                    value={assigneeSearch}
                    onChange={(e) => setAssigneeSearch(e.target.value)}
                    placeholder={assignees.length ? 'Add another person' : 'Search team members'}
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => addAssignee(currentUser)}
                    disabled={!currentUser || assignees.includes(currentUser)}
                  >
                    Assign self
                  </button>
                </div>
                {pickerOpen && assigneeSearch === debouncedAssigneeSearch && debouncedAssigneeSearch.trim() && (
                  <div className="assignee-picker__results" aria-label="Team members">
                    {people.map((name) => (
                      <button
                        type="button"
                        key={name}
                        onClick={() => addAssignee(name)}
                      >
                        <span className="assignee-picker__avatar">
                          {name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('')}
                        </span>
                        <span>{name}{name === currentUser ? ' (you)' : ''}</span>
                      </button>
                    ))}
                    {!people.length && <div className="assignee-picker__empty">No team members found</div>}
                  </div>
                )}
              </div>
            </div>

            <div className="field assignee-selection">
              <label>Assigned people</label>
              <div className="assignee-selection__box" aria-label="Selected assignees">
                {assignees.length ? (
                  <div className="assignee-picker__chips">
                    {assignees.map((name) => (
                      <span key={name}>
                        {name}
                        <button
                          type="button"
                          aria-label={`Remove ${name}`}
                          onClick={() => setAssignees((current) => current.filter((person) => person !== name))}
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="assignee-selection__empty">Assigned to no one</span>
                )}
              </div>
            </div>
          </div>

          {error && <p className="error">{error}</p>}

          <div className="modal__footer">
            <button type="button" className="button secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="button" disabled={saving}>
              {saving ? 'Saving…' : item ? 'Save Changes' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
