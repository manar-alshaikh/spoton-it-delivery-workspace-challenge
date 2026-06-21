// Pure formatting helpers — no React, no side effects, easy to test.

/** Returns 1-2 uppercase initials from a full name, or '?' if null. */
export function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/** Formats an ISO date string to "May 30" style. */
export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/** Converts a snake_case status/type key to Title Case label. */
export function labelFromKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
