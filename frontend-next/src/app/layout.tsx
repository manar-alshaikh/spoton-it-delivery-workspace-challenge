import type { Metadata } from 'next';
import ThemeScript from '@/components/layout/ThemeScript';
import './globals.css';

export const metadata: Metadata = {
  title: 'SpotOn Project Engine',
  description: 'IT Delivery Workspace',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Runs before paint — sets data-theme from localStorage to prevent flash */}
        <ThemeScript />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
