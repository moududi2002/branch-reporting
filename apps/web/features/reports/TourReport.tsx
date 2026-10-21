// apps/web/features/reports/TourReport.tsx

'use client';

import { useState } from 'react';
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

type TourRow = {
  role: string;
  purpose: string;
  purposeCustom?: string;
  day: number;
  bar: number;
};

export function TourReport({
  form,
  reportId,
  editable,
}: {
  form: FormResponse;
  reportId: string;
  editable: boolean;
}) {
  const tableField = form.template.fields.find(
    (f) => f.fieldType === 'TABLE_ROWS' && f.key === 'tour.table',
  );

  const roles: string[] = tableField?.layoutMeta?.roles ?? [];
  const existing = form.tableRows[tableField?.id ?? ''];

  const highlighted = tableField
    ? isFieldHighlighted(form, tableField.id)
    : false;

  const [rows, setRows] = useState<TourRow[]>(() =>
    roles.map((role, idx) => {
      const found = existing?.find((r) => r.rowIndex === idx);
      const data = found?.data;

      const savedPurpose = String(data?.purpose ?? '');
      const savedPurposeCustom = String(data?.purposeCustom ?? '');

      const isKnownPurpose =
        savedPurpose === '' || PURPOSES.includes(savedPurpose);

      return {
        role,
        purpose: isKnownPurpose
          ? savedPurpose
          : '__other__',
        purposeCustom:
          savedPurposeCustom ||
          (!isKnownPurpose ? savedPurpose : ''),
        day: Number(data?.day ?? 0),
        bar: Number(data?.bar ?? 0),
      };
    }),
  );

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  async function save() {
    if (!tableField || !editable || saving) return;

    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    // বর্তমান state-কে API payload format-এ রূপান্তর
    const rowsData = rows;

    const rowsPayload = rowsData.map((r, i) => ({
      rowIndex: i,
      rowData: {
        role: r.role,
        purpose:
          r.purpose === '__other__'
            ? (r.purposeCustom ?? '')
            : r.purpose,
        purposeRaw: r.purpose,
        purposeCustom: r.purposeCustom ?? '',
        day: r.day,
        bar: r.bar,
      },
    }));

    try {
      await api(`/reports/${reportId}/table-rows/${tableField.id}`, {
        method: 'POST',
        body: JSON.stringify({ rows: rowsPayload }),
      });

      setSaveSuccess(true);
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : 'সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded bg-white shadow">
        <table className="min-w-full text-sm">
          <thead className="bg-emerald text-white">
            <tr>
              <th className="p-2 text-left">দায়িত্ব</th>
              <th className="p-2 text-left">উপলক্ষ্য</th>
              <th className="w-20 p-2 text-right">দিন</th>
              <th className="w-20 p-2 text-right">বার</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r, i) => (
              <tr key={`${r.role}-${i}`} className="border-b">
                <td className="p-2">{r.role}</td>

                <td className="p-2">
                  <select
                    className="mb-1 w-full rounded border px-1 py-0.5"
                    disabled={!editable}
                    value={r.purpose}
                    onChange={(e) => {
                      const purpose = e.target.value;

                      setRows((prev) =>
                        prev.map((x, k) =>
                          k === i
                            ? {
                                ...x,
                                purpose,
                                purposeCustom:
                                  purpose === '__other__'
                                    ? x.purposeCustom ?? ''
                                    : '',
                              }
                            : x,
                        ),
                      );

                      setSaveSuccess(false);
                    }}
                  >
                    <option value="">—</option>

                    {PURPOSES.map((purpose) => (
                      <option key={purpose} value={purpose}>
                        {purpose}
                      </option>
                    ))}

                    <option value="__other__">অন্যান্য</option>
                  </select>

                  {r.purpose === '__other__' && (
                    <input
                      className="w-full rounded border px-1 py-0.5"
                      placeholder="উপলক্ষ্য লিখুন"
                      disabled={!editable}
                      value={r.purposeCustom ?? ''}
                      onChange={(e) => {
                        const purposeCustom = e.target.value;

                        setRows((prev) =>
                          prev.map((x, k) =>
                            k === i
                              ? { ...x, purposeCustom }
                              : x,
                          ),
                        );

                        setSaveSuccess(false);
                      }}
                    />
                  )}
                </td>

                <td className="p-2 text-right">
                  <input
                    type="number"
                    min={0}
                    className="w-20 rounded border px-1 py-0.5 text-right"
                    disabled={!editable}
                    value={r.day}
                    onChange={(e) => {
                      const day = Math.max(
                        0,
                        Number(e.target.value) || 0,
                      );

                      setRows((prev) =>
                        prev.map((x, k) =>
                          k === i ? { ...x, day } : x,
                        ),
                      );

                      setSaveSuccess(false);
                    }}
                  />
                </td>

                <td className="p-2 text-right">
                  <input
                    type="number"
                    min={0}
                    className="w-20 rounded border px-1 py-0.5 text-right"
                    disabled={!editable}
                    value={r.bar}
                    onChange={(e) => {
                      const bar = Math.max(
                        0,
                        Number(e.target.value) || 0,
                      );

                      setRows((prev) =>
                        prev.map((x, k) =>
                          k === i ? { ...x, bar } : x,
                        ),
                      );

                      setSaveSuccess(false);
                    }}
                  />
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="p-4 text-center text-gray-500"
                >
                  কোনো দায়িত্বের তথ্য পাওয়া যায়নি।
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div
        className={`overflow-x-auto rounded bg-white p-3 shadow ${
          highlighted ? 'ring-2 ring-amber-400' : ''
        }`}
      >
        {editable && (
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded bg-emerald px-3 py-1 text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ'}
            </button>

            {saveSuccess && (
              <span className="text-sm text-green-700">
                সফলভাবে সংরক্ষণ হয়েছে।
              </span>
            )}

            {saveError && (
              <span className="text-sm text-red-600">
                {saveError}
              </span>
            )}
          </div>
        )}

        <Signature />
      </div>
    </div>
  );
}
