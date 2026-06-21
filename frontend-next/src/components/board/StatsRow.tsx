// Four equal-width stat cards above the kanban board.

import StatCard from '@/components/ui/StatCard';
import type { IconName } from '@/components/ui/Icon';

interface StatsRowProps {
  counts: Record<string, number>;
}

const STATS: { label: string; key: string; icon: IconName; color: string }[] = [
  { label: 'Total Work Items',  key: '__total__',       icon: 'layers',    color: '#6366f1' },
  { label: 'In Progress',       key: 'in_progress',     icon: 'spinner',   color: '#3b82f6' },
  { label: 'In QA',             key: 'qa',              icon: 'search',    color: '#a855f7' },
  { label: 'Ready for Release', key: 'ready_for_release', icon: 'rocket',  color: '#22c55e' },
];

export default function StatsRow({ counts }: StatsRowProps) {
  const total = Object.values(counts).reduce((s, v) => s + v, 0);

  return (
    <div className="stats-row">
      {STATS.map(({ label, key, icon, color }) => {
        const value = key === '__total__' ? total : (counts[key] ?? 0);
        const sub = key === '__total__'
          ? 'Across all statuses'
          : total > 0
            ? `${Math.round((value / total) * 100)}% of total`
            : '0% of total';

        return (
          <StatCard
            key={key}
            label={label}
            value={value}
            sub={sub}
            icon={icon}
            accentColor={color}
          />
        );
      })}
    </div>
  );
}
