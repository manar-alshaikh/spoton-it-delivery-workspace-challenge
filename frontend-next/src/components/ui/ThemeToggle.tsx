'use client';

import { useEffect, useState } from 'react';

// Layout: [icon] [track/thumb] [label]
// Icon is outside the track — not inside it.

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('spoton_theme');
    const isDark = saved
      ? saved === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDark(isDark);
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    const value = next ? 'dark' : 'light';
    localStorage.setItem('spoton_theme', value);
    document.documentElement.setAttribute('data-theme', value);
  }

  return (
    <button
      role="switch"
      aria-checked={dark}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggle}
      className={`theme-switch${dark ? ' theme-switch--on' : ''}`}
    >
      {/* Icon + label on the LEFT */}
      <span className="theme-switch__icon" aria-hidden="true">
        {dark ? '🌙' : '☀️'}
      </span>
      <span className="theme-switch__label">{dark ? 'Dark' : 'Light'}</span>

      {/* Track on the RIGHT */}
      <span className="theme-switch__track">
        <span className="theme-switch__thumb" />
      </span>
    </button>
  );
}
