// apps/web/app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Branch Reporting' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}