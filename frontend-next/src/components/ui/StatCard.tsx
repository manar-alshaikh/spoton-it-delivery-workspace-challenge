import React from 'react';

interface StatCardProps {
  label: string;
  value: number;
  sub?: string;
  icon: React.ReactNode;
  accentColor?: string;
}

export default function StatCard({ label, value, sub, icon, accentColor = 'var(--orange)' }: StatCardProps) {
  return (
    <div className="stat-card card">
      <div className="stat-card__icon" style={{ color: accentColor }}>
        {icon}
      </div>
      <div className="stat-card__body">
        <div className="stat-card__label">{label}</div>
        <div className="stat-card__value">{value}</div>
        {sub && <div className="stat-card__sub">{sub}</div>}
      </div>
    </div>
  );
}
