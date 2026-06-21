// All board-level constants in one place.
// Import from here — never hardcode these in components.

export const WORK_ITEM_STATUSES = [
  'backlog',
  'planned',
  'in_progress',
  'qa',
  'ready_for_release',
  'released',
] as const;

export type WorkItemStatus = (typeof WORK_ITEM_STATUSES)[number];

export const COLUMN_LABELS: Record<WorkItemStatus, string> = {
  backlog:           'Backlog',
  planned:           'Planned',
  in_progress:       'In Progress',
  qa:                'QA',
  ready_for_release: 'Ready for Release',
  released:          'Released',
};

export const COLUMN_COLORS: Record<WorkItemStatus, string> = {
  backlog:           '#94a3b8',
  planned:           '#6366f1',
  in_progress:       '#3b82f6',
  qa:                '#a855f7',
  ready_for_release: '#22c55e',
  released:          '#64748b',
};
