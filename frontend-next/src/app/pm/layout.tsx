'use client';

import Sidebar from '@/components/layout/Sidebar';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function PmLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <Sidebar />
      <div className="main">
        {/* Persistent top bar — theme toggle always in top-right */}
        <header className="topbar">
          <div className="topbar__right">
            <ThemeToggle />
          </div>
        </header>
        <div className="page-content">{children}</div>
      </div>
    </div>
  );
}
