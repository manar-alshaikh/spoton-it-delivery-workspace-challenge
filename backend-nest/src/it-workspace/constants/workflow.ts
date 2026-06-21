// Valid status transitions for work items.
// The key is the CURRENT status, the value is the list of statuses it can move TO.
// This is the single source of truth — service and tests both import from here.

export const VALID_TRANSITIONS: Record<string, string[]> = {
  backlog:           ['planned', 'in_progress', 'qa', 'ready_for_release', 'released'],
  planned:           ['backlog', 'in_progress', 'qa', 'ready_for_release', 'released'],
  in_progress:       ['backlog', 'planned', 'qa', 'ready_for_release', 'released'],
  qa:                ['backlog', 'planned', 'in_progress', 'ready_for_release', 'released'],
  ready_for_release: ['backlog', 'planned', 'in_progress', 'qa', 'released'],
  released:          ['backlog', 'planned', 'in_progress', 'qa', 'ready_for_release'],
};

export const ALL_STATUSES   = Object.keys(VALID_TRANSITIONS);
export const ALL_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export const ALL_TYPES      = ['feature', 'bug', 'improvement', 'maintenance'] as const;
