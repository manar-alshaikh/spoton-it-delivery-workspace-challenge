// Prevents flash of wrong theme on first load.
// Must run before React hydrates, so it uses next/script with beforeInteractive.

import Script from 'next/script';

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var saved = localStorage.getItem('spoton_theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = saved || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (_) {}
})();
`;

export default function ThemeScript() {
  return (
    <Script
      id="theme-init"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
    />
  );
}
