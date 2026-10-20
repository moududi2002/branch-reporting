// apps/web/app/admin/thanas/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { AuthGate } from '@/components/AuthGate';
import { AppShell } from '@/components/AppShell';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';

export default function ThanasAdmin() {
  return (
    <AuthGate roles={['SUPER_ADMIN', 'BRANCH_ADMIN']}>
      <AppShell><Inner /></AppShell>
    </AuthGate>
  );
}

function Inner() {
  const { user } = useAuth();
  const [branches, setBranches] = useState<any[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [thanas, setThanas] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  useEffect(() => {
    api<any[]>('/branches').then((bs) => {
      setBranches(bs);
      const own = user?.role === 'BRANCH_ADMIN' ? user.branchId : bs[0]?.id;
      if (own) setSelected(own);
    });
  }, [user]);

  async function refresh() {
    if (!selected) return;
    setThanas(await api<any[]>(`/branches/${selected}/thanas`));
  }
  useEffect(() => { refresh(); }, [selected]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    await api(`/branches/${selected}/thanas`, { method: 'POST', body: JSON.stringify({ name, code }) });
    setName(''); setCode('');
    refresh();
  }

  async function rename(id: string) {
    const newName = prompt('নতুন নাম');
    if (!newName) return;
    await api(`/thanas/${id}/rename`, { method: 'POST', body: JSON.stringify({ name: newName }) });
    refresh();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-emerald">থানা ব্যবস্থাপনা</h1>
      {user?.role === 'SUPER_ADMIN' && (
        <select className="border rounded px-2 py-1" value={selected} onChange={(e) => setSelected(e.target.value)}>
          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      )}
      <form onSubmit={create} className="bg-white rounded shadow p-4 flex gap-2 flex-wrap">
        <input className="border rounded px-2 py-1" placeholder="থানার নাম" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className="border rounded px-2 py-1" placeholder="কোড" value={code} onChange={(e) => setCode(e.target.value)} required />
        <button className="bg-emerald text-white rounded px-3 py-1" type="submit">তৈরি</button>
      </form>
      <div className="bg-white rounded shadow divide-y">
        {thanas.map((t) => (
          <div key={t.id} className="p-3 flex items-center justify-between text-sm">
            <div><p className="font-semibold">{t.name}</p><p className="text-xs text-gray-500">{t.code}</p></div>
            <button className="text-emerald underline text-xs" onClick={() => rename(t.id)}>নাম পরিবর্তন</button>
          </div>
        ))}
        {!thanas.length && <p className="p-3 text-sm text-gray-500">কোনো থানা নেই।</p>}
      </div>
    </div>
  );
}