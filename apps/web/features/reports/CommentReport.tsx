// apps/web/features/reports/CommentReport.tsx
'use client';
import { FormResponse } from '@/lib/types';
import { isFieldHighlighted } from './RevisionBanner';

export function CommentReport({
  form,
  editable,
  onSave,
}: {
  form: FormResponse;
  editable: boolean;
  onSave: (fieldId: string, value: string) => void;
}) {
  const bySection = (key: string) =>
    form.template.fields.filter((f) => f.key.startsWith(key)).sort((a, b) => a.order - b.order);

  const renderTextarea = (fieldId: string, label: string) => {
    if (!form.template.fields.some((f) => f.id === fieldId)) return null;
    const prev = form.previous[fieldId] ?? '';
    const cur = form.current[fieldId] ?? '';
    const highlighted = isFieldHighlighted(form, fieldId);
    return (
      <div key={fieldId} className="space-y-1">
        <label className="text-sm font-medium">{label}</label>
        <textarea
          className={`w-full border rounded p-2 min-h-[64px] ${highlighted ? 'border-amber-400 bg-amber-50' : ''}`}
          disabled={!editable}
          defaultValue={cur || prev}
          onBlur={(e) => onSave(fieldId, e.target.value)}
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded shadow p-4 space-y-2">
        <h2 className="font-semibold text-emerald">ভূমিকা</h2>
        {bySection('comment.intro').map((f) => renderTextarea(f.id, f.labelBn))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded shadow p-4 space-y-2">
          <h2 className="font-semibold text-emerald">সমস্যা সমূহ</h2>
          {bySection('comment.problem').map((f) => renderTextarea(f.id, f.labelBn))}
        </div>
        <div className="bg-white rounded shadow p-4 space-y-2">
          <h2 className="font-semibold text-emerald">সম্ভাবনা সমূহ</h2>
          {bySection('comment.prospect').map((f) => renderTextarea(f.id, f.labelBn))}
        </div>
      </div>

      <div className="bg-white rounded shadow p-4 space-y-2">
        <h2 className="font-semibold text-emerald">করণীয় সমূহ</h2>
        {bySection('comment.action').map((f) => renderTextarea(f.id, f.labelBn))}
      </div>

      <div className="bg-white rounded shadow p-4 space-y-2">
        <h2 className="font-semibold text-emerald">উপসংহার</h2>
        {bySection('comment.conclusion').map((f) => renderTextarea(f.id, f.labelBn))}
      </div>

      <Signature />
    </div>
  );
}

export function Signature() {
  return (
    <div className="bg-white rounded shadow p-4 flex justify-end">
      <div className="text-center">
        <div className="h-12 w-48 border-b border-gray-400" />
        <p className="text-xs mt-1">সভাপতির স্বাক্ষর</p>
      </div>
    </div>
  );
}