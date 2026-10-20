// apps/web/features/reports/InstitutionMatrixFull.tsx
'use client';
import { useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { FormResponse } from '@/lib/types';

function flattenRows(defs: any[]) {
  const out: Array<{ label: string; sub?: string; index: number }> = [];
  defs.forEach((r, i) => {
    if (r.group) r.group.forEach((g: string, gi: number) => out.push({ label: r.label, sub: g, index: i * 100 + gi }));
    else out.push({ label: r.label, index: i * 100 });
  });
  return out;
}

function MatrixTable({
  form, reportId, fieldKey, editable, title, carryForward, pageTotal,
}: {
  form: FormResponse; reportId: string; fieldKey: string; editable: boolean; title: string;
  carryForward?: Array<{ rowIndex: number; data: any }>;
  pageTotal?: Array<{ rowIndex: number; data: any }>;
}) {
  const field = form.template.fields.find((f) => f.key === fieldKey);
  const layout = field?.layoutMeta ?? {};
  const rowsDef = layout.rows ?? [];
  const columns: string[] = layout.columns ?? [];
  const existing = form.tableRows[field?.id ?? ''] ?? [];
  const flat = useMemo(() => flattenRows(rowsDef), [rowsDef]);

  const [data, setData] = useState<Record<number, Record<string, number>>>(() =>
    Object.fromEntries(flat.map((r) => [r.index, existing.find((e) => e.rowIndex === r.index)?.data ?? {}])),
  );

  async function save() {
    if (!field) return;
    await api(`/reports/${reportId}/table-rows/${field.id}`, {
      method: 'POST',
      body: JSON.stringify({ rows: Object.entries(data).map(([i, d]) => ({ rowIndex: Number(i), rowData: d })) }),
    });
  }

  // column header groups (every 4 columns = a group per Blueprint)
  const columnGroups = useMemo(() => {
    const groups: Array<{ label: string; span: number }> = [];
    // simple heuristic: 4-col groups (প্রতিষ্ঠান, সংগঠন, মানের, সমর্থক, উপশাখা, কর্মী/সাথী/সদস্য/মোট, ...)
    const knownGroups = [
      { label: 'প্রতিষ্ঠান', span: 4 },
      { label: 'সংগঠন', span: 5 },
      { label: 'কোন মানের', span: 3 },
      { label: 'সমর্থক সংগঠন', span: 4 },
      { label: 'মোট উপশাখা', span: 4 },
      { label: 'কর্মী/সাথী/সদস্য/মোট', span: 8 },
      { label: 'শাখার অধীনস্থ', span: 6 },
    ];
    let used = 0;
    for (const g of knownGroups) { if (used >= columns.length) break; groups.push(g); used += g.span; }
    if (used < columns.length) groups.push({ label: '', span: columns.length - used });
    return groups;
  }, [columns]);

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-emerald">{title}</h3>
      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-[1800px] text-[10px]">
          <thead>
            <tr className="bg-gray-300">
              <th rowSpan={2} className="border p-1 text-left sticky left-0 bg-gray-300 z-10">প্রতিষ্ঠান</th>
              {columnGroups.map((g, i) => (
                <th key={i} colSpan={g.span} className="border p-1 text-center">{g.label}</th>
              ))}
            </tr>
            <tr className="bg-gray-200">
              {columns.map((c) => (
                <th key={c} className="border p-1 writing-vertical text-[9px]" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: 100 }}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {flat.map((r) => (
              <tr key={r.index}>
                <td className="border p-1 bg-gray-50 sticky left-0 z-10">{r.label}{r.sub ? ` — ${r.sub}` : ''}</td>
                {columns.map((c) => (
                  <td key={c} className="border p-0">
                    <input type="number" className="w-full min-w-[48px] p-1 text-right" disabled={!editable}
                      value={data[r.index]?.[c] ?? ''}
                      onChange={(e) => setData((prev) => ({ ...prev, [r.index]: { ...(prev[r.index] ?? {}), [c]: Number(e.target.value) } }))} />
                  </td>
                ))}
              </tr>
            ))}
            {carryForward?.length ? (
              <tr className="bg-sky-50">
                <td className="border p-1 font-semibold sticky left-0 bg-sky-50 z-10">প্রথম পাতা থেকে</td>
                {columns.map((c) => <td key={c} className="border p-1 text-right">{carryForward[0].data[c] ?? '—'}</td>)}
              </tr>
            ) : null}
            {pageTotal?.length ? (
              <tr className="bg-amber-50">
                <td className="border p-1 font-semibold sticky left-0 bg-amber-50 z-10">এই পৃষ্ঠা মোট</td>
                {columns.map((c) => <td key={c} className="border p-1 text-right">{pageTotal[0].data[c] ?? '—'}</td>)}
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {editable && <button onClick={save} className="bg-emerald text-white px-3 py-1 rounded text-sm">সংরক্ষণ</button>}
    </div>
  );
}

export function InstitutionMatrixFull({ form, reportId, editable }: { form: FormResponse; reportId: string; editable: boolean }) {
  const page1TotalField = form.template.fields.find((f) => f.key === 'matrix.page1.total');
  const carryField = form.template.fields.find((f) => f.key === 'matrix.page2.carryForward');
  const grandTotalField = form.template.fields.find((f) => f.key === 'matrix.page2.grandTotal');

  return (
    <div className="space-y-6">
      <MatrixTable
        form={form} reportId={reportId} fieldKey="matrix.page1.table" editable={editable} title="পৃষ্ঠা ১"
        pageTotal={page1TotalField ? form.tableRows[page1TotalField.id] : undefined}
      />
      <MatrixTable
        form={form} reportId={reportId} fieldKey="matrix.page2.table" editable={editable} title="পৃষ্ঠা ২"
        carryForward={carryField ? form.tableRows[carryField.id] : undefined}
        pageTotal={grandTotalField ? form.tableRows[grandTotalField.id] : undefined}
      />
    </div>
  );
}