'use client';

// Top bar rendered above the main content area.
// Shows the current page title on the left and action buttons on the right.

import ThemeToggle from '@/components/ui/ThemeToggle';

interface TopBarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function TopBar({ title, subtitle, actions }: TopBarProps) {
  return (
    <header className="topbar">
      <div className="topbar__left">
        <h1 className="topbar__title">{title}</h1>
        {subtitle && <p className="topbar__subtitle">{subtitle}</p>}
      </div>

      <div className="topbar__right">
        {actions}
        <ThemeToggle />
      </div>
    </header>
  );
}
