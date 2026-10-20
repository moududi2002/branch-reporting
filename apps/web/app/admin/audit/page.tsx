'use client';
import { useEffect, useState } from 'react';
import { AuthGate } from '@/components/AuthGate';
import { AppShell } from '@/components/AppShell';
import { api } from '@/lib/api';
export default function AuditPage() {
  return <AuthGate roles={['SUPER_ADMIN']}><AppShell><Inner /></AppShell></AuthGate>;
}
function Inner() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { api<any[]>('/audit-logs?limit=100').then(setRows).catch(() => setRows([])); }, []);
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold text-emerald">Audit Log</h1>
      <div className="bg-white rounded shadow divide-y text-sm">
        {rows.map((r) => <div key={r.id} className="p-2">{new Date(r.createdAt).toLocaleString('bn-BD')} — {r.action} — {r.entity} {r.entityId}</div>)}
      </div>
    </div>
  );
}