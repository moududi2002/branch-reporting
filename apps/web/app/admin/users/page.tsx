// apps/web/app/admin/users/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { AuthGate } from '@/components/AuthGate';
import { AppShell } from '@/components/AppShell';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';

export default function UsersAdmin() {
  return (
    <AuthGate roles={['SUPER_ADMIN', 'BRANCH_ADMIN']}>
      <AppShell><Inner /></AppShell>
    </AuthGate>
  );
}

function Inner() {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [thanas, setThanas] = useState<any[]>([]);
  const [form, setForm] = useState({ email: '', password: '', fullName: '', role: 'THANA_ADMIN', branchId: '', thanaId: '' });
  const [msg, setMsg] = useState<string | null>(null);

  async function refresh() {
    const qs = user?.role === 'BRANCH_ADMIN' ? `?branchId=${user.branchId}` : '';
    setUsers(await api<any[]>(`/users${qs}`));
    const bs = await api<any[]>('/branches');
    setBranches(bs);
  }

  useEffect(() => { refresh(); }, [user]);

  useEffect(() => {
    if (!form.branchId) return;
    api<any[]>(`/branches/${form.branchId}/thanas`).then(setThanas).catch(() => setThanas([]));
  }, [form.branchId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    try {
      await api('/users', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          branchId: form.branchId || undefined,
          thanaId: form.thanaId || undefined,
        }),
      });
      setMsg('ইউজার তৈরি হয়েছে');
      refresh();
    } catch (e: any) { setMsg(`ত্রুটি: ${e.message}`); }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-emerald">ইউজার ব্যবস্থাপনা</h1>

      <form onSubmit={submit} className="bg-white rounded shadow p-4 grid md:grid-cols-3 gap-3">
        <input className="border rounded px-2 py-1" placeholder="পূর্ণ নাম" value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
        <input className="border rounded px-2 py-1" placeholder="ইমেইল" type="email" value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input className="border rounded px-2 py-1" placeholder="পাসওয়ার্ড" type="password" value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <select className="border rounded px-2 py-1" value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}>
          {user?.role === 'SUPER_ADMIN' && <>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="BRANCH_ADMIN">Branch Admin</option>
            <option value="VIEWER">Viewer</option>
          </>}
          <option value="THANA_ADMIN">Thana Admin</option>
        </select>
        <select className="border rounded px-2 py-1" value={form.branchId}
          onChange={(e) => setForm({ ...form, branchId: e.target.value, thanaId: '' })} required>
          <option value="">শাখা নির্বাচন</option>
          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        {form.role === 'THANA_ADMIN' && (
          <select className="border rounded px-2 py-1" value={form.thanaId}
            onChange={(e) => setForm({ ...form, thanaId: e.target.value })} required>
            <option value="">থানা নির্বাচন</option>
            {thanas.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        )}
        <button className="bg-emerald text-white rounded px-3 py-1 md:col-span-3" type="submit">তৈরি করুন</button>
        {msg && <p className="text-sm md:col-span-3">{msg}</p>}
      </form>

      <div className="bg-white rounded shadow divide-y">
        {users.map((u) => (
          <div key={u.id} className="p-3 flex items-center justify-between text-sm">
            <div>
              <p className="font-semibold">{u.fullName} <span className="text-xs text-gray-500">({u.email})</span></p>
              <p className="text-xs">{u.role} • {u.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}</p>
            </div>
            <button onClick={async () => { await api(`/users/${u.id}/deactivate`, { method: 'POST' }); refresh(); }}
              className="text-red-600 underline text-xs">নিষ্ক্রিয়</button>
          </div>
        ))}
      </div>
    </div>
  );
}