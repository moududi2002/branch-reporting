// apps/web/app/admin/periods/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { AuthGate } from '@/components/AuthGate';
import { AppShell } from '@/components/AppShell';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';

export default function PeriodsAdmin() {
  return <AuthGate roles={['SUPER_ADMIN', 'BRANCH_ADMIN']}><AppShell><Inner /></AppShell></AuthGate>;
}

function Inner() {
  const { user } = useAuth();
  const [branches, setBranches] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [form, setForm] = useState({ branchId: '', academicSessionId: '', reportTypeId: '', label: '', periodStart: '', periodEnd: '', submissionDeadline: '', revisionDeadline: '' });
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    api<any[]>('/branches').then((bs) => { setBranches(bs); if (user?.branchId) setForm((f) => ({ ...f, branchId: user.branchId! })); });
    api<any[]>('/academic-sessions').then(setSessions);
    api<any[]>('/report-types').then(setTypes);
  }, [user]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    try {
      await api(`/branches/${form.branchId}/reporting-periods`, { method: 'POST', body: JSON.stringify(form) });
      setMsg('period তৈরি হয়েছে, draft auto-create হয়েছে');
    } catch (e: any) { setMsg(`ত্রুটি: ${e.message}`); }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-emerald">Reporting Period</h1>
      <form onSubmit={submit} className="bg-white rounded shadow p-4 grid md:grid-cols-2 gap-3">
        {user?.role === 'SUPER_ADMIN' && (
          <select className="border rounded px-2 py-1" value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })} required>
            <option value="">শাখা</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}
        <select className="border rounded px-2 py-1" value={form.academicSessionId} onChange={(e) => setForm({ ...form, academicSessionId: e.target.value })} required>
          <option value="">সেশন</option>
          {sessions.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <select className="border rounded px-2 py-1" value={form.reportTypeId} onChange={(e) => setForm({ ...form, reportTypeId: e.target.value })} required>
          <option value="">রিপোর্টের ধরন</option>
          {types.map((t) => <option key={t.id} value={t.id}>{t.nameBn}</option>)}
        </select>
        <input className="border rounded px-2 py-1" placeholder="লেবেল (মার্চ ২০২৪)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required />
        <input className="border rounded px-2 py-1" type="date" value={form.periodStart} onChange={(e) => setForm({ ...form, periodStart: e.target.value })} required />
        <input className="border rounded px-2 py-1" type="date" value={form.periodEnd} onChange={(e) => setForm({ ...form, periodEnd: e.target.value })} required />
        <input className="border rounded px-2 py-1" type="date" value={form.submissionDeadline} onChange={(e) => setForm({ ...form, submissionDeadline: e.target.value })} required />
        <input className="border rounded px-2 py-1" type="date" value={form.revisionDeadline} onChange={(e) => setForm({ ...form, revisionDeadline: e.target.value })} required />
        <button className="bg-emerald text-white rounded px-3 py-1 md:col-span-2" type="submit">Period খুলুন</button>
        {msg && <p className="text-sm md:col-span-2">{msg}</p>}
      </form>
    </div>
  );
}