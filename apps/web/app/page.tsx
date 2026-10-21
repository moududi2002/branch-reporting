// apps/web/app/page.tsx
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    api('/auth/me')
      .then(() => router.replace('/dashboard'))
      .catch(() => router.replace('/login'));
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sm text-gray-600">লোড হচ্ছে…</p>
    </div>
  );
}