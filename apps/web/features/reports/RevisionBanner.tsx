// apps/web/features/reports/RevisionBanner.tsx
'use client';
import { ActiveRevision, FormResponse } from '@/lib/types';

export function RevisionBanner({
  form,
}: {
  form: FormResponse;
}) {
  const rev: ActiveRevision | null = form.activeRevision;
  if (!rev) return null;

  const targetLabels = form.template.fields
    .filter((f) => rev.targetFieldIds.includes(f.id))
    .map((f) => f.labelBn);

  return (
    <div className="bg-amber-50 border border-amber-300 rounded p-3 space-y-1">
      <p className="font-semibold text-amber-800">সংশোধনী প্রয়োজন</p>
      <p className="text-sm text-amber-900">{rev.reason}</p>
      {targetLabels.length > 0 && (
        <p className="text-xs text-amber-800">
          সংশোধনের জন্য চিহ্নিত: {targetLabels.join(', ')}
        </p>
      )}
      {form.revisionDeadline && (
        <p className="text-xs text-amber-800">
          সংশোধনের শেষ তারিখ: {new Date(form.revisionDeadline.dueAt).toLocaleDateString('bn-BD')}
        </p>
      )}
    </div>
  );
}

export function isFieldHighlighted(form: FormResponse, fieldId: string): boolean {
  return !!form.activeRevision?.targetFieldIds?.includes(fieldId);
}