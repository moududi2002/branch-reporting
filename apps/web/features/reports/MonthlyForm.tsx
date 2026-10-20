// apps/web/features/reports/MonthlyForm.tsx

'use client';

import { useMemo, useState } from 'react';
import { FormResponse, ReportField } from '@/lib/types';
import { EmployeeGrowthTable } from './EmployeeGrowthTable';
import { MonthlyGrid } from './MonthlyGrid';

export function MonthlyForm({
  form,
  editable,
  reportId,
  onSave,
}: {
  form: FormResponse;
  editable: boolean;
  reportId: string;
  onSave: (field: ReportField, value: string) => void;
}) {
  const sections = useMemo(
    () => [...form.template.sections].sort((a, b) => a.order - b.order),
    [form],
  );

  const [active, setActive] = useState<string>(
    sections[0]?.id ?? '',
  );

  const section = sections.find((s) => s.id === active);

  const progressBySection = useMemo(() => {
    const map: Record<string, { filled: number; total: number }> = {};

    for (const s of sections) {
      const fields = form.template.fields.filter(
        (f) => f.sectionId === s.id,
      );

      const filled = fields.filter(
        (f) =>
          form.current[f.id] != null &&
          form.current[f.id] !== '',
      ).length;

      map[s.id] = { filled, total: fields.length };
    }

    return map;
  }, [sections, form]);

  const fields = form.template.fields
    .filter((f) => f.sectionId === active)
    .sort((a, b) => a.order - b.order);

  const sectionKey = section?.key ?? '';
  const parallel = sectionKey === 'p2.meetings';

  return (
    <div className="grid md:grid-cols-4 gap-4">
      <aside className="md:col-span-1 bg-white rounded shadow p-3 space-y-1">
        {sections.map((s) => {
          const p = progressBySection[s.id];

          return (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={`w-full text-left px-3 py-2 rounded ${
                active === s.id
                  ? 'bg-emerald text-white'
                  : 'hover:bg-gray-100'
              }`}
            >
              <div className="text-sm">{s.titleBn}</div>
              <div className="text-[10px] opacity-70">
                {p.filled}/{p.total}
              </div>
            </button>
          );
        })}
      </aside>

      <section className="md:col-span-3 bg-white rounded shadow p-4 space-y-3">
        <h2 className="font-semibold text-emerald">
          {section?.titleBn}
        </h2>

        {fields.some(
          (f) =>
            f.fieldType === 'TABLE_ROWS' &&
            f.key === 'employeeGrowth.table',
        ) ? (
          <EmployeeGrowthTable
            form={form}
            reportId={reportId}
            editable={editable}
          />
        ) : (
          <MonthlyGrid
            form={form}
            sectionId={active}
            editable={editable}
            onSave={(f, v) => onSave(f, v)}
            sectionKey={sectionKey}
            parallel={parallel}
          />
        )}
      </section>
    </div>
  );
}
