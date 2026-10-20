// apps/web/components/AuthGate.tsx
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-store';

export function AuthGate({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, loading, load } = useAuth();
  const router = useRouter();

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!loading && !user) router.replace('/login');
    if (!loading && user && roles && !roles.includes(user.role)) router.replace('/dashboard');
  }, [loading, user, roles, router]);

  if (loading || !user) return <div className="p-6">লোড হচ্ছে…</div>;
  return <>{children}</>;
}