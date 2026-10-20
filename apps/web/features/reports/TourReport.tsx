// apps/web/features/reports/TourReport.tsx
'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { FormResponse } from '@/lib/types';
import { Signature } from './CommentReport';
import { isFieldHighlighted } from './RevisionBanner';

const PURPOSES = [
  'প্রোগ্রাম বাস্তবায়ন',
  'যোগাযোগ ও প্রোগ্রাম বাস্তবায়ন',
  'সার্বিক যোগাযোগ ও প্রোগ্রাম বাস্তবায়ন',
  'সার্বিক যোগাযোগ ও অর্থ কালেকশন',
];

const rows = rowsData.map((r, i) => ({
  rowIndex: i,
  rowData: {
    role: r.role,
    purpose: r.purpose === '__other__' ? (r.purposeCustom ?? '') : r.purpose,
    purposeRaw: r.purpose,
    purposeCustom: r.purposeCustom ?? '',
    day: r.day,
    bar: r.bar,
  },
}));

export function TourReport({ form, reportId, editable }: { form: FormResponse; reportId: string; editable: boolean }) {
  const tableField = form.template.fields.find((f) => f.fieldType === 'TABLE_ROWS' && f.key === 'tour.table');
  const roles: string[] = tableField?.layoutMeta?.roles ?? [];
  const existing = form.tableRows[tableField?.id ?? ''] ?? [];
  const highlighted = tableField ? isFieldHighlighted(form, tableField.id) : false;

  const [rows, setRows] = useState<Array<{ role: string; purpose: string; day: number; bar: number }>>(
    roles.map((role, idx) => {
      const found = existing.find((r) => r.rowIndex === idx);
      return {
        role,
        purpose: found?.data?.purpose ?? '',
        day: found?.data?.day ?? 0,
        bar: found?.data?.bar ?? 0,
      };
    }),
  );

  async function save() {
    if (!tableField) return;
    await api(`/reports/${reportId}/table-rows/${tableField.id}`, {
      method: 'POST',
      body: JSON.stringify({ rows: rows.map((r, i) => ({ rowIndex: i, rowData: r })) }),
    });
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-emerald text-white">
            <tr>
              <th className="p-2 text-left">দায়িত্ব</th>
              <th className="p-2 text-left">উপলক্ষ্য</th>
              <th className="p-2 text-right w-20">দিন</th>
              <th className="p-2 text-right w-20">বার</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b">
                <td className="p-2">{r.role}</td>
                <td className="p-2">
                 <select
                      className="border rounded px-1 py-0.5 w-full mb-1"
                      disabled={!editable}
                      value={r.purpose === '__other__' ? '__other__' : r.purpose}
                      onChange={(e) => setRows((prev) => prev.map((x, k) => (k === i ? { ...x, purpose: e.target.value } : x)))}
                    >
                      <option value="">—</option>
                      {PURPOSES.map((p) => <option key={p} value={p}>{p}</option>)}
                      <option value="__other__">অন্যান্য</option>
                    </select>
                    {r.purpose === '__other__' && (
                      <input className="border rounded px-1 py-0.5 w-full" placeholder="লিখুন" disabled={!editable}
                        value={r.purposeCustom ?? ''}
                        onChange={(e) => setRows((prev) => prev.map((x, k) => (k === i ? { ...x, purposeCustom: e.target.value } : x)))} />
                    )}
                </td>
                <td className="p-2 text-right">
                  <input type="number" min={0} className="border rounded px-1 py-0.5 w-20 text-right" disabled={!editable} value={r.day}
                    onChange={(e) => setRows((prev) => prev.map((x, k) => (k === i ? { ...x, day: Number(e.target.value) } : x)))} />
                </td>
                <td className="p-2 text-right">
                  <input type="number" min={0} className="border rounded px-1 py-0.5 w-20 text-right" disabled={!editable} value={r.bar}
                    onChange={(e) => setRows((prev) => prev.map((x, k) => (k === i ? { ...x, bar: Number(e.target.value) } : x)))} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={`bg-white rounded shadow overflow-x-auto ${highlighted ? 'ring-2 ring-amber-400' : ''}`}>
      {editable && (
        <button onClick={save} className="bg-emerald text-white px-3 py-1 rounded">সংরক্ষণ</button>
      )}
      <Signature />
    </div>
  );
}