// apps/web/features/reports/FinancialReport.tsx
'use client';
import { useState } from 'react';
import { FormResponse } from '@/lib/types';
import { Signature } from './CommentReport';
import { isFieldHighlighted } from './RevisionBanner';

export function FinancialReport({
  form,
  editable,
  onSave,
}: {
  form: FormResponse;
  editable: boolean;
  onSave: (fieldId: string, value: string) => void;
}) {
  const incomeFields = form.template.fields.filter((f) => f.key.startsWith('fin.income.')).sort((a, b) => a.order - b.order);
  const expenseFields = form.template.fields.filter((f) => f.key.startsWith('fin.expense.')).sort((a, b) => a.order - b.order);
  const totalFields = form.template.fields.filter((f) => f.key.startsWith('fin.total.') || f.key === 'fin.surplus');

  const commentField = form.template.fields.find((f) => f.key === 'fin.comment.text');
  const [comment, setComment] = useState<string>((form.current[commentField?.id ?? ''] ?? '') as string);

  const incomeSum = incomeFields.reduce((s, f) => s + Number(form.current[f.id] ?? 0), 0);
  const expenseSum = expenseFields.reduce((s, f) => s + Number(form.current[f.id] ?? 0), 0);
  const commentHighlighted = commentField ? isFieldHighlighted(form, commentField.id) : false;
  
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded shadow">
          <div className="bg-blue-900 text-white px-3 py-2 font-semibold">আয়</div>
          <table className="w-full text-sm">
            <thead className="bg-blue-50">
              <tr>
                <th className="text-left p-2">আয়ের উৎস</th>
                <th className="text-right p-2">প্রাপ্ত টাকা</th>
              </tr>
            </thead>
            <tbody>
              {incomeFields.map((f) => (
                <tr key={f.id} className="border-b">
                  <td className="p-2">{f.labelBn.replace(' — প্রাপ্ত টাকা', '')}</td>
                  <td className="p-2 text-right">
                    <input
                      type="number"
                      className="border rounded px-2 py-0.5 w-28 text-right"
                      disabled={!editable}
                      defaultValue={form.current[f.id] ?? ''}
                      onBlur={(e) => onSave(f.id, e.target.value)}
                    />
                  </td>
                </tr>
              ))}
              <tr className="font-semibold bg-blue-50">
                <td className="p-2">এ মাসের মোট আয়</td>
                <td className="p-2 text-right">{incomeSum}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded shadow">
          <div className="bg-blue-900 text-white px-3 py-2 font-semibold">ব্যয়</div>
          <table className="w-full text-sm">
            <thead className="bg-blue-50">
              <tr>
                <th className="text-left p-2">ব্যয়ের খাত</th>
                <th className="text-right p-2">পরিমাণ</th>
              </tr>
            </thead>
            <tbody>
              {expenseFields.map((f) => (
                <tr key={f.id} className="border-b">
                  <td className="p-2">{f.labelBn.replace(' — পরিমাণ', '')}</td>
                  <td className="p-2 text-right">
                    <input
                      type="number"
                      className="border rounded px-2 py-0.5 w-28 text-right"
                      disabled={!editable}
                      defaultValue={form.current[f.id] ?? ''}
                      onBlur={(e) => onSave(f.id, e.target.value)}
                    />
                  </td>
                </tr>
              ))}
              <tr className="font-semibold bg-blue-50">
                <td className="p-2">এ মাসের মোট ব্যয়</td>
                <td className="p-2 text-right">{expenseSum}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-sky-100 rounded shadow p-4 grid md:grid-cols-3 gap-4">
        {totalFields.map((f) => (
          <div key={f.id}>
            <p className="text-xs text-gray-700">{f.labelBn}</p>
            <p className="text-lg font-bold text-blue-900">{form.current[f.id] ?? '—'}</p>
          </div>
        ))}
        <div className="md:col-span-3">
          <p className="text-xs text-gray-700">উদ্বৃত্ত (স্বয়ংক্রিয়)</p>
          <p className="text-lg font-bold text-blue-900">{incomeSum - expenseSum}</p>
        </div>
      </div>

      <div className="bg-sky-50 rounded shadow p-4 space-y-2">
        <p className="font-semibold text-sky-900">মন্তব্য</p>
        <textarea
          className="w-full border rounded p-2 min-h-[72px]"
          disabled={!editable || !commentField}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onBlur={() => commentField && onSave(commentField.id, comment)}
          placeholder="মন্তব্য লিখুন…"
        />
      </div>
      <div className={`bg-sky-50 rounded shadow p-4 space-y-2 ${commentHighlighted ? 'ring-2 ring-amber-400' : ''}`}></div>
      <Signature />
    </div>
  );
}