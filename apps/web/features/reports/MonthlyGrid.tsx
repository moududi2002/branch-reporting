// apps/web/features/reports/MonthlyGrid.tsx
'use client';
import { FormResponse, ReportField } from '@/lib/types';
import { isFieldHighlighted } from './RevisionBanner';

/**
 * Renders a section as a row × column grid, based on the field key naming:
 * <sectionKey>.<rowName>.<columnName>
 * If the section has 2-column parallel layout (meetings), it splits rows left/right.
 */
export function MonthlyGrid({
  form, sectionId, editable, onSave, sectionKey, parallel,
}: {
  form: FormResponse;
  sectionId: string;
  editable: boolean;
  onSave: (field: ReportField, value: string) => void;
  sectionKey: string;
  parallel?: boolean;
}) {
  const section = form.template.sections.find((s) => s.id === sectionId);
  const allFields = form.template.fields.filter((f) => f.sectionId === sectionId && f.fieldType !== 'TABLE_ROWS');
  // group by second-last key segment (row name), third-to-last optional
  const rowsMap = new Map<string, Map<string, ReportField>>();
  const colSet = new Set<string>();

  for (const f of allFields) {
    const parts = f.key.split('.');
    // ignore first (section) and last (column). Row = parts.slice(1, -1).join('.')
    const rowKey = parts.slice(1, -1).join(' ') || parts[1];
    const colKey = parts[parts.length - 1];
    if (!rowsMap.has(rowKey)) rowsMap.set(rowKey, new Map());
    rowsMap.get(rowKey)!.set(colKey, f);
    colSet.add(colKey);
  }

  const rows = Array.from(rowsMap.keys());
  const cols = Array.from(colSet);

  const half = Math.ceil(rows.length / 2);
  const groups = parallel ? [rows.slice(0, half), rows.slice(half)] : [rows];

  return (
    <div className="space-y-4">
      {groups.map((rowGroup, gi) => (
        <div key={gi} className="overflow-x-auto bg-white rounded shadow">
          <table className="min-w-full text-xs">
            <thead className="bg-gray-200">
              <tr>
                <th className="border p-1 text-left sticky left-0 bg-gray-200 z-10">সারি</th>
                {cols.map((c) => <th key={c} className="border p-1 text-[10px]">{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {rowGroup.map((row) => (
                <tr key={row}>
                  <td className="border p-1 bg-gray-50 sticky left-0 z-10">{row}</td>
                  {cols.map((c) => {
                    const f = rowsMap.get(row)?.get(c);
                    if (!f) return <td key={c} className="border p-1 text-gray-400">—</td>;
                    const hl = isFieldHighlighted(form, f.id);
                    const computed = form.computed ?? {};
                    const val = computed[f.id] ?? form.current[f.id];
                    const isComputed = computed[f.id] != null;
                    return (
                      <td key={c} className={`border p-0 ${hl ? 'bg-amber-50' : ''}`}>
                        <input
                          className={`w-full min-w-[56px] p-1 ${isComputed ? 'bg-gray-50 text-gray-700' : ''}`}
                          type={f.fieldType === 'NUMBER' ? 'number' : 'text'}
                          disabled={!editable || f.isReadOnly || isComputed}
                          value={val ?? ''}
                          onChange={(e) => {
                            // local-only immediate reflection
                            form.current[f.id] = f.fieldType === 'NUMBER' ? Number(e.target.value) : e.target.value;
                          }}
                          onBlur={(e) => onSave(f, e.target.value)}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}