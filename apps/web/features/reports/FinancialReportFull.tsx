// apps/web/features/reports/FinancialReportFull.tsx
'use client';
import { useState } from 'react';
import { FormResponse } from '@/lib/types';
import { Signature } from './CommentReport';

export function FinancialReportFull({ form, editable, onSave }: { form: FormResponse; editable: boolean; onSave: (id: string, v: string) => void }) {
  const fullIncome = form.template.fields.filter((f) => f.key.startsWith('fin.income.') && f.key.split('.').length === 5);
  const simpleIncome = form.template.fields.filter((f) => f.key.startsWith('fin.income.') && f.key.endsWith('.received') && f.key.split('.').length === 4);
  const expense = form.template.fields.filter((f) => f.key.startsWith('fin.expense.') && f.key.endsWith('.amount')).sort((a, b) => a.order - b.order);
  const quota = form.template.fields.find((f) => f.key === 'fin.expense.quota.amount');
  const totals = form.template.fields.filter((f) => f.key.startsWith('fin.total.')).sort((a, b) => a.order - b.order);
  const commentField = form.template.fields.find((f) => f.key === 'fin.comment.text');
  const [comment, setComment] = useState<string>((form.current[commentField?.id ?? ''] ?? '') as string);

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded shadow">
          <div className="bg-blue-900 text-white px-3 py-2 font-semibold">আয়</div>
          <table className="w-full text-sm">
            <thead className="bg-blue-50"><tr>
              <th className="text-left p-2">আয়ের উৎস</th>
              <th className="text-right p-2">মোট সংখ্যা</th>
              <th className="text-right p-2">বৃদ্ধি সংখ্যা</th>
              <th className="text-right p-2">ধার্য পরিমাণ</th>
              <th className="text-right p-2">আদায় সংখ্যা</th>
              <th className="text-right p-2">প্রাপ্ত টাকা</th>
            </tr></thead>
            <tbody>
              {fullIncome.map((f) => {
                const parts = f.key.split('.');
                const row = parts[2]; const sub = parts[4];
                if (sub !== 'received') return null;
                const group = fullIncome.filter((x) => x.key.startsWith(`fin.income.${row}.`));
                const get = (s: string) => group.find((x) => x.key.endsWith(`.${s}`));
                return (
                  <tr key={row} className="border-b">
                    <td className="p-2">{row}</td>
                    {['total', 'growth', 'fixed', 'collected', 'received'].map((s) => {
                      const gf = get(s); if (!gf) return <td key={s} />;
                      return <td key={s} className="p-1 text-right"><input type="number" disabled={!editable} className="w-24 border rounded px-1 text-right" defaultValue={form.current[gf.id] ?? ''} onBlur={(e) => onSave(gf.id, e.target.value)} /></td>;
                    })}
                  </tr>
                );
              })}
             {simpleIncome.map((f) => (
              <tr key={f.id} className="border-b">
                <td className="p-2">{f.labelBn.replace(' — প্রাপ্ত টাকা', '')}</td>
                <td className="p-1 text-right"></td>
                <td className="p-1 text-right"></td>
                <td className="p-1 text-right"></td>
                <td className="p-1 text-right"></td>
                <td className="p-1 text-right"><input type="number" disabled={!editable} className="w-24 border rounded px-1 text-right" defaultValue={form.current[f.id] ?? ''} onBlur={(e) => onSave(f.id, e.target.value)} /></td>
              </tr>
            ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded shadow">
          <div className="bg-blue-900 text-white px-3 py-2 font-semibold">ব্যয়</div>
          {quota && (
            <div className="p-2 bg-blue-50 text-sm flex justify-between">
              <span>ঊর্ধ্বতন এয়ানত ধার্য কোটা</span>
              <input type="number" disabled={!editable} className="w-24 border rounded px-1 text-right" defaultValue={form.current[quota.id] ?? ''} onBlur={(e) => onSave(quota.id, e.target.value)} />
            </div>
          )}
          <table className="w-full text-sm">
            <thead className="bg-blue-50"><tr><th className="text-left p-2">ব্যয়ের খাত</th><th className="text-right p-2">পরিমাণ</th></tr></thead>
            <tbody>
              {expense.map((f) => (
                <tr key={f.id} className="border-b">
                  <td className="p-2">{f.labelBn.replace(' — পরিমাণ', '')}</td>
                  <td className="p-1 text-right"><input type="number" disabled={!editable} className="w-24 border rounded px-1 text-right" defaultValue={form.current[f.id] ?? ''} onBlur={(e) => onSave(f.id, e.target.value)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-sky-100 rounded shadow p-4 grid md:grid-cols-4 gap-3">
        {totals.map((f) => (
          <div key={f.id}><p className="text-xs">{f.labelBn}</p><p className="text-lg font-bold text-blue-900">{form.current[f.id] ?? '—'}</p></div>
        ))}
      </div>

      <div className="bg-sky-50 rounded shadow p-4 space-y-2">
        <p className="font-semibold text-sky-900">মন্তব্য</p>
        <textarea className="w-full border rounded p-2 min-h-[72px]" disabled={!editable || !commentField} value={comment} onChange={(e) => setComment(e.target.value)} onBlur={() => commentField && onSave(commentField.id, comment)} placeholder="মন্তব্য লিখুন…" />
      </div>

      <Signature />
    </div>
  );
}