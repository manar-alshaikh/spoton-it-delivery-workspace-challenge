// Valid status transitions for work items.
// The key is the CURRENT status, the value is the list of statuses it can move TO.
// This is the single source of truth — service and tests both import from here.

export const VALID_TRANSITIONS: Record<string, string[]> = {
  backlog:           ['planned'],
  planned:           ['in_progress', 'backlog'],
  in_progress:       ['qa', 'planned'],
  qa:                ['ready_for_release', 'in_progress'],
  ready_for_release: ['qa'],
  released:          [],
};

export const ALL_STATUSES   = Object.keys(VALID_TRANSITIONS);
export const ALL_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export const ALL_TYPES      = ['feature', 'bug', 'improvement', 'maintenance'] as const;
