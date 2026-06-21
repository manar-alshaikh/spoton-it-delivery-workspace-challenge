// Single stat card — equal-size box with icon, value, label, and optional sub text.
// Width is controlled by the parent grid, not this component.

import Icon from '@/components/ui/Icon';
import type { IconName } from '@/components/ui/Icon';

interface StatCardProps {
  label:       string;
  value:       number;
  sub?:        string;
  icon:        IconName;
  accentColor: string;
}

export default function StatCard({ label, value, sub, icon, accentColor }: StatCardProps) {
  return (
    <div className="stat-card card">
      <div className="stat-card__icon" style={{ color: accentColor, borderColor: accentColor + '33' }}>
        <Icon name={icon} size={22} />
      </div>
      <div className="stat-card__body">
        <div className="stat-card__label">{label}</div>
        <div className="stat-card__value">{value}</div>
        {sub && <div className="stat-card__sub">{sub}</div>}
      </div>
    </div>
  );
}
