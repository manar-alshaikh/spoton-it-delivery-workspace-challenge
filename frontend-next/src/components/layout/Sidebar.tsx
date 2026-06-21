'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearToken } from '@/lib/api';
import Icon from '@/components/ui/Icon';

const NAV_ITEMS = [
  { href: '/pm/it-workspace', label: 'IT Workspace', icon: 'layers'   },
  { href: '/pm/releases',     label: 'Releases',     icon: 'rocket'   },
  { href: '/pm/score',        label: 'Score',         icon: 'zap'     },
] as const;

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
            <Icon name={icon} size={16} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="sidebar__bottom">
        <button
          className="nav-logout"
          onClick={() => { clearToken(); router.push('/login'); }}
        >
          <Icon name="x" size={15} />
          Logout
        </button>
      </div>
    </aside>
  );
}
