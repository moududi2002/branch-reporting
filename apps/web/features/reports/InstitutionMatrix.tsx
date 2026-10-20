// apps/web/features/reports/InstitutionMatrix.tsx
'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { FormResponse } from '@/lib/types';

export function InstitutionMatrix({
  form,
  reportId,
  editable,
}: {
  form: FormResponse;
  reportId: string;
  editable: boolean;
}) {
  const tableField = form.template.fields.find((f) => f.key === 'matrix.table');
  const layout = tableField?.layoutMeta as any;
  const rowsDef: Array<{ label: string; group?: string[] }> = layout?.rows ?? [];
  const columns: string[] = layout?.columns ?? [];
  const existing = form.tableRows[tableField?.id ?? ''] ?? [];

  // flatten rows into data entries
  const flatRows: Array<{ label: string; sub?: string; index: number }> = [];
  rowsDef.forEach((r, i) => {
    if (r.group) {
      r.group.forEach((g, gi) => flatRows.push({ label: r.label, sub: g, index: i * 100 + gi }));
    } else {
      flatRows.push({ label: r.label, index: i * 100 });
    }
  });

  const [data, setData] = useState<Record<number, Record<string, number>>>(
    Object.fromEntries(
      flatRows.map((fr) => {
        const found = existing.find((e) => e.rowIndex === fr.index);
        return [fr.index, found?.data ?? {}];
      }),
    ),
  );

  async function save() {
    if (!tableField) return;
    const rows = Object.entries(data).map(([idx, rowData]) => ({ rowIndex: Number(idx), rowData }));
    await api(`/reports/${reportId}/table-rows/${tableField.id}`, {
      method: 'POST',
      body: JSON.stringify({ rows }),
    });
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-[1800px] text-[11px]">
          <thead>
            <tr className="bg-gray-200">
              <th rowSpan={2} className="border p-1 text-left sticky left-0 bg-gray-200 z-10">প্রতিষ্ঠান</th>
              {columns.map((c) => <th key={c} className="border p-1 align-bottom">{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {flatRows.map((fr) => (
              <tr key={fr.index}>
                <td className="border p-1 bg-gray-50 sticky left-0 z-10">
                  {fr.label}
                  {fr.sub && <span className="text-gray-500"> — {fr.sub}</span>}
                </td>
                {columns.map((c) => (
                  <td key={c} className="border p-0">
                    <input
                      type="number"
                      className="w-full min-w-[48px] p-1 text-right"
                      disabled={!editable}
                      value={data[fr.index]?.[c] ?? ''}
                      onChange={(e) =>
                        setData((prev) => ({
                          ...prev,
                          [fr.index]: { ...(prev[fr.index] ?? {}), [c]: Number(e.target.value) },
                        }))
                      }
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editable && <button onClick={save} className="bg-emerald text-white px-3 py-1 rounded">সংরক্ষণ</button>}
    </div>
  );
}