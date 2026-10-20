// apps/web/app/reports/[reportId]/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AuthGate } from '@/components/AuthGate';
import { AppShell } from '@/components/AppShell';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { FormResponse, ReportField, ReportSection } from '@/lib/types';

export default function ReportFormPage() {
  return (
    <AuthGate>
      <AppShell>
        <ReportForm />
      </AppShell>
    </AuthGate>
  );
}

function ReportForm() {
  const { reportId } = useParams<{ reportId: string }>();
  const { user } = useAuth();

  const [form, setForm] = useState<FormResponse | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    api<FormResponse>(`/reports/${reportId}/form`).then((f) => {
      setForm(f);

      const first = [...f.template.sections].sort(
        (a, b) => a.order - b.order,
      )[0];

      setActiveSection(first?.id ?? null);
    });
  }, [reportId]);

  if (!form) return <p>লোড হচ্ছে…</p>;

  const sections: ReportSection[] = [...form.template.sections].sort(
    (a, b) => a.order - b.order,
  );

  const fieldsFor = (sectionId: string) =>
    form.template.fields
      .filter((f) => f.sectionId === sectionId)
      .sort((a, b) => a.order - b.order);

  async function saveField(field: ReportField, value: string) {
    const isNum = field.fieldType === 'NUMBER';

    const payload = isNum
      ? { valueNum: value === '' ? null : Number(value) }
      : { valueText: value };

    setSaving(true);

    try {
      await api(`/reports/${reportId}/values`, {
        method: 'POST',
        body: JSON.stringify({
          values: [{ fieldId: field.id, ...payload }],
        }),
      });

      setForm((prev) =>
        prev
          ? {
              ...prev,
              current: {
                ...prev.current,
                [field.id]:
                  isNum
                    ? value === ''
                      ? null
                      : Number(value)
                    : value,
              },
            }
          : prev,
      );

      setMsg('সংরক্ষিত');
    } catch (e: any) {
      setMsg(`ত্রুটি: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  const canEdit =
    user?.role === 'THANA_ADMIN' ||
    user?.role === 'SUPER_ADMIN';

  const editable =
    canEdit && form.report.status !== 'APPROVED';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-emerald">
          রিপোর্ট ফর্ম
        </h1>

        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
          অবস্থা: {form.report.status} • v{form.report.version}
        </span>
      </div>

      {msg && (
        <p className="text-sm text-gray-600">
          {msg}
          {saving ? ' (সংরক্ষণ…)' : ''}
        </p>
      )}

      <div className="grid md:grid-cols-4 gap-4">
        <aside className="md:col-span-1 bg-white rounded-lg shadow p-3 space-y-1">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`w-full text-left px-3 py-2 rounded ${
                activeSection === s.id
                  ? 'bg-emerald text-white'
                  : 'hover:bg-gray-100'
              }`}
            >
              {s.titleBn}
            </button>
          ))}
        </aside>

        <section className="md:col-span-3 bg-white rounded-lg shadow p-4 space-y-3">
          {activeSection && (
            <>
              <h2 className="font-semibold text-emerald">
                {sections.find((s) => s.id === activeSection)?.titleBn}
              </h2>

              {fieldsFor(activeSection).map((f) => {
                const prev = form.previous[f.id];
                const cur = form.current[f.id];

                return (
                  <div
                    key={f.id}
                    className="grid grid-cols-3 gap-3 items-center"
                  >
                    <label className="text-sm col-span-1">
                      {f.labelBn}
                    </label>

                    <div className="col-span-1 text-sm text-gray-500">
                      পূর্বের: {prev ?? '—'}
                    </div>

                    <div className="col-span-1">
                      <input
                        className="w-full border rounded px-2 py-1"
                        type={f.fieldType === 'NUMBER' ? 'number' : 'text'}
                        disabled={!editable || f.isReadOnly}
                        defaultValue={cur ?? ''}
                        onBlur={(e) => saveField(f, e.target.value)}
                      />
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </section>
      </div>

      <WorkflowButtons
        reportId={reportId}
        status={form.report.status}
        role={user?.role ?? 'VIEWER'}
      />
    </div>
  );
}

function WorkflowButtons({
  reportId,
  status,
  role,
}: {
  reportId: string;
  status: string;
  role: string;
}) {
  const [busy, setBusy] = useState(false);
  const [comment, setComment] = useState('');
  const [reason, setReason] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  async function call(path: string, body?: any) {
    setBusy(true);
    setMsg(null);

    try {
      await api(`/reports/${reportId}${path}`, {
        method: 'POST',
        body: JSON.stringify({
          ...(body ?? {}),
          comment,
        }),
      });

      setMsg('সফল');
      window.location.reload();
    } catch (e: any) {
      setMsg(`ত্রুটি: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-3">
      <h2 className="font-semibold">ওয়ার্কফ্লো</h2>

      <div>
        <label className="block text-sm mb-1">
          মন্তব্য
        </label>

        <textarea
          className="w-full border rounded px-3 py-2"
          placeholder="মন্তব্য লিখুন..."
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={busy}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {(role === 'THANA_ADMIN' || role === 'SUPER_ADMIN') &&
          status === 'DRAFT' && (
            <button
              disabled={busy}
              onClick={() => call('/submit')}
              className="bg-emerald text-white px-3 py-1 rounded"
            >
              জমা দিন
            </button>
          )}

        {(role === 'THANA_ADMIN' || role === 'SUPER_ADMIN') &&
          status === 'REVISION_REQUESTED' && (
            <button
              disabled={busy}
              onClick={() => call('/resubmit')}
              className="bg-emerald text-white px-3 py-1 rounded"
            >
              পুনরায় জমা
            </button>
          )}

        {(role === 'BRANCH_ADMIN' || role === 'SUPER_ADMIN') &&
          status === 'SUBMITTED' && (
            <>
              <button
                disabled={busy}
                onClick={() => call('/approve')}
                className="bg-emerald text-white px-3 py-1 rounded"
              >
                অনুমোদন
              </button>

              <button
                disabled={busy}
                onClick={() =>
                  call('/reject', {
                    comment: reason || 'প্রত্যাখ্যাত',
                    reason,
                  })
                }
                className="bg-red-600 text-white px-3 py-1 rounded"
              >
                প্রত্যাখ্যান
              </button>

              <button
                disabled={busy}
                onClick={() =>
                  call('/request-revision', {
                    reason: reason || 'সংশোধনী প্রয়োজন',
                  })
                }
                className="bg-amber-600 text-white px-3 py-1 rounded"
              >
                সংশোধনী চাই
              </button>

              <input
                className="border rounded px-2 py-1"
                placeholder="প্রত্যাখ্যান বা সংশোধনের কারণ"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={busy}
              />
            </>
          )}

        {(role === 'BRANCH_ADMIN' || role === 'SUPER_ADMIN') &&
          status === 'APPROVED' && (
            <button
              disabled={busy}
              onClick={() => call('/new-version')}
              className="bg-emerald-dark text-white px-3 py-1 rounded"
            >
              নতুন সংস্করণ
            </button>
          )}
      </div>

      {msg && <p className="text-sm">{msg}</p>}
    </div>
  );
}
