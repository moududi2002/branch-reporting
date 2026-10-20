// apps/web/app/reports/period/[periodId]/page.tsx
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AuthGate } from '@/components/AuthGate';
import { AppShell } from '@/components/AppShell';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';

export default function PeriodReportsPage() {
  return (
    <AuthGate>
      <AppShell>
        <Inner />
      </AppShell>
    </AuthGate>
  );
}

function Inner() {
  const { periodId } = useParams<{ periodId: string }>();
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    // For a thana user we can list own reports; for a branch user, list reports in branch.
    // Backend endpoint: /reports?periodId=... (to be added if not present; using aggregates fallback)
    api<any[]>(`/reporting-periods/${periodId}/reports`).then(setReports).catch(() => setReports([]));
  }, [user, periodId]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-emerald">সময়কালের রিপোর্ট</h1>
      <div className="bg-white rounded-lg shadow divide-y">
        {reports.map((r) => (
          <div key={r.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold">{r.thana?.name ?? r.thanaSnapshotName}</p>
              <p className="text-xs">{r.status}</p>
            </div>
            <Link className="text-emerald underline" href={`/reports/${r.id}`}>ফর্ম</Link>
          </div>
        ))}
        {!reports.length && <p className="p-4 text-sm text-gray-500">কোনো রিপোর্ট নেই।</p>}
      </div>
    </div>
  );
}