// apps/web/components/AppShell.tsx
'use client';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-store';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-emerald text-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="font-bold">ব্রাঞ্চ রিপোর্টিং</Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/dashboard">ড্যাশবোর্ড</Link>
            {user?.role !== 'VIEWER' && <Link href="/reports">রিপোর্ট</Link>}
            <span className="opacity-70">{user?.role}</span>
            <button onClick={logout} className="bg-emerald-dark px-3 py-1 rounded">লগআউট</button>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto p-4">{children}</main>
    </div>
  );
}