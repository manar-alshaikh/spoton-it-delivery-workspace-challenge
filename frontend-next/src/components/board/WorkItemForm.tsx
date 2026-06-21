'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { api } from '@/lib/api';
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue';
import type { WorkItem, WorkItemType, WorkItemPriority, WorkItemStatus } from '@/lib/types';

const TYPES      = ['feature', 'bug', 'improvement', 'maintenance'] as const;
const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
const TEAM_DIRECTORY = ['Aisha Clarke', 'Ethan Taylor', 'Jordan Cole', 'Maya Wong', 'Sam Patel'];

interface WorkItemFormProps {
  item?:             WorkItem | null;
  defaultStatus?:    string;
  onSave:            (data: Partial<WorkItem>) => Promise<void>;
  onClose:           () => void;
  assigneeOptions?:  string[];
}

export default function WorkItemForm({
  item,
  defaultStatus = 'backlog',
  onSave,
  onClose,
  assigneeOptions = [],
}: WorkItemFormProps) {
  const [title,          setTitle]          = useState(item?.title ?? '');
  const [description,    setDescription]    = useState(item?.description ?? '');
  const [type,           setType]           = useState<WorkItemType>(item?.type ?? 'feature');
  const [priority,       setPriority]       = useState<WorkItemPriority>(item?.priority ?? 'medium');
  const [dueDate,        setDueDate]        = useState(item?.dueDate?.slice(0, 10) ?? '');
  const [assignees,      setAssignees]      = useState<string[]>(
    item?.assignee?.split(',').map((n) => n.trim()).filter(Boolean) ?? [],
  );
  const [search,         setSearch]         = useState('');
  const [pickerOpen,     setPickerOpen]     = useState(false);
  const [currentUser,    setCurrentUser]    = useState('');
  const [saving,         setSaving]         = useState(false);
  const [error,          setError]          = useState('');
  const pickerRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebouncedValue(search, 220);

  useEffect(() => {
    api.me().then((u) => setCurrentUser(u.name)).catch(() => {});
  }, []);

  // Close picker on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const suggestions = debouncedSearch.trim()
    ? Array.from(new Set([currentUser, ...assigneeOptions, ...TEAM_DIRECTORY].filter(Boolean)))
        .filter((n) => !assignees.includes(n) && n.toLowerCase().includes(debouncedSearch.toLowerCase()))
    : [];

  function addAssignee(name: string) {
    if (name && !assignees.includes(name)) setAssignees((prev) => [...prev, name]);
    setSearch('');
    setPickerOpen(false);
  }

  function removeAssignee(name: string) {
    setAssignees((prev) => prev.filter((n) => n !== name));
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
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
          {/* Title */}
          <div className="field">
            <label htmlFor="wi-title">Title *</label>
            <input id="wi-title" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Short, clear title" maxLength={200} />
          </div>

          {/* Description */}
          <div className="field">
            <label htmlFor="wi-description">Description</label>
            <textarea id="wi-description" value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3} placeholder="What needs to be done?" />
          </div>

          {/* Type / Priority / Due date — 3 columns */}
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
              <input id="wi-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          {/* Assignee — [search + assign self] LEFT | [assigned box] RIGHT */}
          <div className="field">
            <label>Assignees</label>
            <div className="assignee-layout">
              {/* Left: search + assign self stacked */}
              <div className="assignee-layout__left" ref={pickerRef}>
                <div className="assignee-row">
                  <div className="assignee-row__input-wrap">
                    <input
                      id="wi-assignee"
                      type="search"
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setPickerOpen(true); }}
                      onFocus={() => setPickerOpen(true)}
                      placeholder="Search team members…"
                      autoComplete="off"
                    />
                    {pickerOpen && debouncedSearch.trim() && (
                      <div className="assignee-row__dropdown" role="listbox">
                        {suggestions.length ? suggestions.map((name) => (
                          <button key={name} type="button" role="option" onMouseDown={() => addAssignee(name)}>
                            <span className="assignee-avatar">
                              {name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('')}
                            </span>
                            {name}{name === currentUser ? ' (you)' : ''}
                          </button>
                        )) : (
                          <div className="assignee-row__empty">No matches</div>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="assignee-self-btn"
                    onClick={() => addAssignee(currentUser)}
                    disabled={!currentUser || assignees.includes(currentUser)}
                  >
                    Assign self
                  </button>
                </div>
              </div>

              {/* Right: fixed-height scrollable box of assigned chips */}
              <div className="assignee-box" aria-label="Assigned people">
                <div className="assignee-box__label">Assigned</div>
                <div className="assignee-box__scroll">
                  {assignees.length ? assignees.map((name) => (
                    <span key={name} className="assignee-chip">
                      <span className="assignee-avatar">
                        {name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('')}
                      </span>
                      {name}
                      <button type="button" aria-label={`Remove ${name}`} onClick={() => removeAssignee(name)}>
                        ×
                      </button>
                    </span>
                  )) : (
                    <span className="assignee-box__empty">No one assigned</span>
                  )}
                </div>
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
