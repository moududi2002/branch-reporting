// apps/web/features/reports/EmployeeGrowthTable.tsx
'use client';
import { useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { FormResponse } from '@/lib/types';

type Row = Record<string, string | number>;

export function EmployeeGrowthTable({
  form,
  reportId,
  editable,
}: {
  form: FormResponse;
  reportId: string;
  editable: boolean;
}) {
  const tableField = form.template.fields.find((f) => f.key === 'monthly.employeeGrowth.table');
  const layout = tableField?.layoutMeta ?? {};
  const columns: string[] = layout.columns ?? [];
  const columnTypes: string[] = layout.columnTypes ?? columns.map(() => 'text');
  const minRows: number = layout.minRows ?? 2;

  const initialRows: Row[] = useMemo(() => {
    const existing = form.tableRows[tableField?.id ?? ''] ?? [];
    if (existing.length === 0) {
      return Array.from({ length: minRows }, (_, i) => ({ __no: String(i + 1) }));
    }
    return existing
      .slice()
      .sort((a, b) => a.rowIndex - b.rowIndex)
      .map((r) => r.data as Row);
  }, [form, tableField?.id, minRows]);

  const [rows, setRows] = useState<Row[]>(initialRows);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function setCell(rowIdx: number, col: string, value: string) {
    setRows((prev) =>
      prev.map((r, i) => (i === rowIdx ? { ...r, [col]: value } : r)),
    );
  }

  function addRow() {
    setRows((prev) => [...prev, { __no: String(prev.length + 1) }]);
  }
  function removeRow(idx: number) {
    setRows((prev) => prev.filter((_, i) => i !== idx).map((r, i) => ({ ...r, __no: String(i + 1) })));
  }

  async function save() {
    if (!tableField) return;
    setSaving(true);
    setMsg(null);
    try {
      const payload = rows.map((r, i) => ({ rowIndex: i, rowData: r }));
      await api(`/reports/${reportId}/table-rows/${tableField.id}`, {
        method: 'POST',
        body: JSON.stringify({ rows: payload }),
      });
      setMsg('সংরক্ষিত');
    } catch (e: any) {
      setMsg(`ত্রুটি: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="min-w-[1400px] text-[11px]">
          <thead className="bg-gray-200">
            <tr>
              {columns.map((c) => (
                <th key={c} className="border p-1 text-left align-bottom">{c}</th>
              ))}
              {editable && <th className="border p-1 w-16">—</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {columns.map((c, ci) => (
                  <td key={c} className="border p-0">
                    <input
                      type={columnTypes[ci] === 'number' ? 'number' : columnTypes[ci] === 'date' ? 'date' : 'text'}
                      className="w-full min-w-[72px] p-1"
                      disabled={!editable}
                      value={(r[c] ?? '') as string}
                      onChange={(e) => setCell(i, c, e.target.value)}
                    />
                  </td>
                ))}
                {editable && (
                  <td className="border p-1 text-center">
                    <button className="text-red-600 text-xs underline" onClick={() => removeRow(i)}>মুছুন</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-2">
        {editable && (
          <>
            <button onClick={addRow} className="bg-gray-100 border rounded px-3 py-1 text-sm">+ সারি</button>
            <button onClick={save} disabled={saving} className="bg-emerald text-white rounded px-3 py-1 text-sm">
              {saving ? 'সংরক্ষণ…' : 'সংরক্ষণ'}
            </button>
          </>
        )}
        {msg && <p className="text-sm">{msg}</p>}
      </div>
    </div>
  );
}