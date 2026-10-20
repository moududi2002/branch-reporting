// apps/web/app/admin/import/page.tsx
'use client';
import { useState } from 'react';
import { AuthGate } from '@/components/AuthGate';
import { AppShell } from '@/components/AppShell';
import { api } from '@/lib/api';

export default function ImportPage() {
  return (
    <AuthGate roles={['SUPER_ADMIN']}>
      <AppShell><Inner /></AppShell>
    </AuthGate>
  );
}

function Inner() {
  const [rows, setRows] = useState<any[]>([]);
  const [preview, setPreview] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setError(null); setPreview(null); setResult(null);
    try {
      const text = await f.text();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error('JSON root must be an array');
      setRows(parsed);
    } catch (e: any) { setError(e.message); }
  }

  async function dryRun() {
    setError(null);
    try { setPreview(await api('/imports/historical/dry-run', { method: 'POST', body: JSON.stringify({ rows }) })); }
    catch (e: any) { setError(e.message); }
  }

  async function commit() {
    if (!confirm(`${rows.length} সারি import করা হবে। নিশ্চিত?`)) return;
    setError(null);
    try { setResult(await api('/imports/historical/commit', { method: 'POST', body: JSON.stringify({ rows, source: 'ui' }) })); }
    catch (e: any) { setError(e.message); }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-emerald">Historical Import</h1>
      <input type="file" accept=".json" onChange={onFile} className="bg-white rounded shadow p-2" />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {rows.length > 0 && (
        <div className="bg-white rounded shadow p-4 space-y-2">
          <p className="text-sm">{rows.length} সারি লোড হয়েছে।</p>
          <div className="flex gap-2">
            <button onClick={dryRun} className="bg-amber-600 text-white px-3 py-1 rounded">Dry Run</button>
            <button onClick={commit} className="bg-emerald text-white px-3 py-1 rounded">Import</button>
          </div>
        </div>
      )}
      {preview && (
        <div className="bg-white rounded shadow p-4">
          <h2 className="font-semibold">Dry Run ফলাফল</h2>
          <p className="text-sm">মোট: {preview.total}, গ্রহণযোগ্য: {preview.acceptedCount}, প্রত্যাখ্যাত: {preview.rejectedCount}</p>
          {preview.errors?.length > 0 && (
            <ul className="text-xs list-disc pl-5 mt-2">
              {preview.errors.map((e: any, i: number) => <li key={i}>সারি #{e.index}: {e.reason}</li>)}
            </ul>
          )}
        </div>
      )}
      {result && (
        <div className="bg-white rounded shadow p-4">
          <h2 className="font-semibold">Import ফলাফল</h2>
          <p className="text-sm">গ্রহণযোগ্য: {result.accepted}, প্রত্যাখ্যাত: {result.rejected}</p>
        </div>
      )}
    </div>
  );
}