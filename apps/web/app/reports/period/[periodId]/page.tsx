// apps/web/app/reports/page.tsx
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AuthGate } from '@/components/AuthGate';
import { AppShell } from '@/components/AppShell';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';

export default function ReportsPage() {
  return (
    <AuthGate>
      <AppShell>
        <ReportsList />
      </AppShell>
    </AuthGate>
  );
}

function ReportsList() {
  const { user } = useAuth();
  const [periods, setPeriods] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.branchId) return;
    api<any[]>(`/reporting-periods?branchId=${user.branchId}`).then(setPeriods).catch(() => setPeriods([]));
  }, [user]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-emerald">রিপোর্ট</h1>
      <div className="bg-white rounded-lg shadow divide-y">
        {periods.map((p) => (
          <div key={p.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold">{p.label} — {p.reportType?.nameBn}</p>
              <p className="text-xs text-gray-500">{p.status}</p>
            </div>
            <Link className="text-emerald underline" href={`/reports/period/${p.id}`}>খুলুন</Link>
          </div>
        ))}
        {!periods.length && <p className="p-4 text-sm text-gray-500">কোনো period নেই।</p>}
      </div>
    </div>
  );
}