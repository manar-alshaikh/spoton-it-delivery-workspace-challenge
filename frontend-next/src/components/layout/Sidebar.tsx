'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearToken } from '@/lib/api';

const NAV_ITEMS = [
  { href: '/pm/it-workspace', label: 'IT Workspace', icon: '⬛' },
  { href: '/pm/releases',     label: 'Releases',     icon: '🚀' },
  { href: '/pm/score',        label: 'Score',         icon: '📊' },
];

export default function Sidebar() {
  const router   = useRouter();
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar__top">
        <div className="brand">SpotOn Project Engine</div>
      </div>

      <nav className="sidebar__nav nav">
        {NAV_ITEMS.map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className={pathname.startsWith(href) ? 'nav-active' : ''}
          >
            <span className="nav-icon">{icon}</span>
            {label}
          </Link>
        ))}
      </nav>

      <div className="sidebar__bottom">
        <button
          className="nav-logout"
          onClick={() => { clearToken(); router.push('/login'); }}
        >
          <span className="nav-icon">↩</span>
          Logout
        </button>
      </div>
    </aside>
  );
}
