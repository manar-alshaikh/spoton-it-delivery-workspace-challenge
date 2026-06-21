// Single source of truth for workflow rules.
// Service and tests both import from here — never hardcode transitions elsewhere.

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

// Score points awarded per workflow event
export const SCORE_EVENTS = {
  WORK_ITEM_CREATED:     { action: 'work_item_created',     points: 1 },
  MOVED_TO_QA:           { action: 'work_item_moved_to_qa', points: 1 },
  MOVED_TO_READY:        { action: 'work_item_ready',       points: 2 },
  RELEASE_DEPLOYED:      { action: 'release_deployed',      points: 3 },
} as const;
