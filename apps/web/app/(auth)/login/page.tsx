// apps/web/app/(auth)/login/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-store';

export default function LoginPage() {
  const login = useAuth((s) => s.login);
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (e: any) {
      setErr(e.message);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white shadow rounded-lg p-6 space-y-4">
        <h1 className="text-xl font-bold text-emerald">লগইন</h1>
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="ইমেইল"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          className="w-full border rounded px-3 py-2"
          placeholder="পাসওয়ার্ড"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className="w-full bg-emerald text-white rounded py-2" type="submit">প্রবেশ</button>
      </form>
    </div>
  );
}