// apps/web/app/(dashboard)/dashboard/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { AuthGate } from '@/components/AuthGate';
import { AppShell } from '@/components/AppShell';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';

export default function DashboardPage() {
  return (
    <AuthGate>
      <AppShell>
        <BranchOrThanaDashboard />
      </AppShell>
    </AuthGate>
  );
}

function BranchOrThanaDashboard() {
  const { user } = useAuth();
  const [running, setRunning] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    if (!user?.branchId) return;
    api(`/branches/${user.branchId}/reporting-periods/running`).then(setRunning).catch(() => setRunning(null));
  }, [user]);

  useEffect(() => {
    if (!user?.branchId || !running?.id) return;
    api(`/branches/${user.branchId}/dashboard/summary?periodId=${running.id}`).then(setSummary).catch(() => setSummary(null));
  }, [user, running]);

  if (!user?.branchId) {
    return <p>আপনার কোনো শাখা assigned নেই। অনুগ্রহ করে Super Admin-এর সাথে যোগাযোগ করুন।</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-emerald">ড্যাশবোর্ড</h1>
      {running ? (
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">চলমান সময়কাল (running)</p>
          <p className="text-lg font-semibold">{running.label} — {running.reportType?.nameBn}</p>
          <p className="text-sm">জমা দেওয়ার শেষ: {new Date(running.submissionDeadline).toLocaleDateString('bn-BD')}</p>
        </div>
      ) : (
        <p className="text-sm text-gray-600">এই মুহূর্তে কোনো চলমান period নেই।</p>
      )}

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="মোট থানা" value={summary.totalThanas} />
          <Stat label="অনুমোদিত" value={summary.approved} />
          <Stat label="জমা দেওয়া" value={summary.submitted} />
          <Stat label="সংশোধনী" value={summary.revisionRequested} />
          <Stat label="প্রত্যাখ্যাত" value={summary.rejected} />
          <Stat label="Draft" value={summary.draft} />
          <Stat label="জমা দেয়নি" value={summary.missing?.length ?? 0} />
        </div>
      )}

      {summary?.missing?.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-semibold mb-2">জমা দেয়নি এমন থানা</h2>
          <ul className="list-disc pl-5 text-sm">
            {summary.missing.map((t: any) => <li key={t.id}>{t.name}</li>)}
          </ul>
        </div>
      )}

      {summary?.pendingList?.length > 0 && (
        <div className="bg-white rounded shadow p-4">
          <h2 className="font-semibold mb-2">অনুমোদনের অপেক্ষায়</h2>
          <ul className="text-sm list-disc pl-5">{summary.pendingList.map((r: any) => <li key={r.id}>{r.thanaName}</li>)}</ul>
        </div>
      )}
      {summary?.revisionList?.length > 0 && (
        <div className="bg-white rounded shadow p-4">
          <h2 className="font-semibold mb-2">সংশোধনী প্রয়োজন</h2>
          <ul className="text-sm list-disc pl-5">{summary.revisionList.map((r: any) => <li key={r.id}>{r.thanaName}</li>)}</ul>
        </div>
      )}
      {summary?.daysToDeadline != null && (
        <p className="text-sm">জমা দেওয়ার শেষ: {new Date(summary.submissionDeadline).toLocaleDateString('bn-BD')} ({summary.daysToDeadline} দিন বাকি)</p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-emerald">{value ?? '—'}</p>
    </div>
  );
}