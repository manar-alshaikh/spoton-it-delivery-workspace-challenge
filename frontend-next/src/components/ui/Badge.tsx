// Badge — displays a colour-coded pill for priority, status, or type values.

import { labelFromKey } from '@/lib/utils/formatting';

type BadgeVariant = 'priority' | 'status' | 'type';

const STYLE_MAP: Record<BadgeVariant, Record<string, string>> = {
  priority: {
    low:    'badge-low',
    medium: 'badge-medium',
    high:   'badge-high',
    urgent: 'badge-urgent',
  },
  status: {
    backlog:           'badge-backlog',
    planned:           'badge-planned',
    in_progress:       'badge-in-progress',
    qa:                'badge-qa',
    ready_for_release: 'badge-ready',
    released:          'badge-released',
  },
  type: {
    feature:     'badge-feature',
    bug:         'badge-bug',
    improvement: 'badge-improvement',
    maintenance: 'badge-maintenance',
  },
};

interface BadgeProps {
  value: string;
  variant: BadgeVariant;
}

export default function Badge({ value, variant }: BadgeProps) {
  const cls = STYLE_MAP[variant][value] ?? 'badge-default';
  return <span className={`badge ${cls}`}>{labelFromKey(value)}</span>;
}
