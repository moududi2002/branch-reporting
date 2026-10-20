// apps/web/app/admin/branches/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { AuthGate } from '@/components/AuthGate';
import { AppShell } from '@/components/AppShell';
import { api } from '@/lib/api';

export default function BranchesAdmin() {
  return (
    <AuthGate roles={['SUPER_ADMIN']}>
      <AppShell><Inner /></AppShell>
    </AuthGate>
  );
}

function Inner() {
  const [branches, setBranches] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  async function refresh() { setBranches(await api<any[]>('/branches')); }
  useEffect(() => { refresh(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    await api('/branches', { method: 'POST', body: JSON.stringify({ name, code }) });
    setName(''); setCode('');
    refresh();
  }

  async function rename(id: string) {
    const newName = prompt('নতুন নাম দিন');
    if (!newName) return;
    await api(`/branches/${id}/rename`, { method: 'POST', body: JSON.stringify({ name: newName }) });
    refresh();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-emerald">শাখা ব্যবস্থাপনা</h1>
      <form onSubmit={create} className="bg-white rounded shadow p-4 flex gap-2 flex-wrap">
        <input className="border rounded px-2 py-1" placeholder="শাখার নাম" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className="border rounded px-2 py-1" placeholder="কোড" value={code} onChange={(e) => setCode(e.target.value)} required />
        <button className="bg-emerald text-white rounded px-3 py-1" type="submit">তৈরি</button>
      </form>
      <div className="bg-white rounded shadow divide-y">
        {branches.map((b) => (
          <div key={b.id} className="p-3 flex items-center justify-between text-sm">
            <div><p className="font-semibold">{b.name}</p><p className="text-xs text-gray-500">{b.code}</p></div>
            <button className="text-emerald underline text-xs" onClick={() => rename(b.id)}>নাম পরিবর্তন</button>
          </div>
        ))}
      </div>
    </div>
  );
}