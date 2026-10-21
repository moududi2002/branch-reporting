// apps/web/app/reports/[reportId]/preview/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AuthGate } from '@/components/AuthGate';
import { AppShell } from '@/components/AppShell';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { FormResponse } from '@/lib/types';
import { CommentReport } from '@/features/reports/CommentReport';
import { CommentCover } from '@/features/reports/CommentCover';
import { MetaHeader } from '@/features/reports/MetaHeader';
import { TourReport } from '@/features/reports/TourReport';
import { FinancialReportFull } from '@/features/reports/FinancialReportFull';
import { InstitutionMatrixFull } from '@/features/reports/InstitutionMatrixFull';
import { MonthlyForm } from '@/features/reports/MonthlyForm';

export default function ReportPreviewPage() {
  return (
    <AuthGate>
      <AppShell>
        <Preview />
      </AppShell>
    </AuthGate>
  );
}

function Preview() {
  const { reportId } = useParams<{ reportId: string }>();
  const { user } = useAuth();
  const [form, setForm] = useState<FormResponse | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ month?: string; session?: string; branchName?: string }>({});

  useEffect(() => {
    api<FormResponse>(`/reports/${reportId}/form`).then(async (f) => {
      setForm(f);
      try {
        const types = await api<any[]>('/report-types');
        const tpl = await api<any>(`/report-templates/${f.template.id}`);
        const t = types.find((x) => x.id === tpl.reportTypeId);
        setCode(t?.code ?? null);
      } catch {}
      try {
        const period = await api<any>(`/reporting-periods/${f.report.reportingPeriodId}`);
        setMeta({
            month: period?.label,
            session: period?.academicSession?.label,
            branchName: f.report.branchSnapshotName ?? undefined,
            });
      } catch {}
    });
  }, [reportId]);

  if (!form) return <p className="p-4">লোড হচ্ছে…</p>;

  const noop = () => {};

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-emerald">
          {code === 'COMMENT' && 'মন্তব্য প্রতিবেদন — প্রিভিউ'}
          {code === 'TOUR' && 'সফর রিপোর্ট — প্রিভিউ'}
          {code === 'FINANCIAL' && 'অর্থনৈতিক প্রতিবেদন — প্রিভিউ'}
          {code === 'INSTITUTION_MATRIX' && 'প্রতিষ্ঠানভিত্তিক ম্যাট্রিক্স — প্রিভিউ'}
          {code === 'MONTHLY' && 'মাসিক রিপোর্ট — প্রিভিউ'}
          {!code && 'রিপোর্ট প্রিভিউ'}
        </h1>
        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
          {form.report.status} • v{form.report.version} • read-only
        </span>
      </div>

      <MetaHeader month={meta.month} session={meta.session} branchName={meta.branchName} />

      {code === 'COMMENT' && (
        <>
          <CommentCover month={meta.month ?? ''} session={meta.session ?? ''} />
          <CommentReport form={form} editable={false} onSave={noop} />
        </>
      )}
      {code === 'TOUR' && <TourReport form={form} reportId={reportId} editable={false} />}
      {code === 'FINANCIAL' && <FinancialReportFull form={form} editable={false} onSave={noop} />}
      {code === 'INSTITUTION_MATRIX' && <InstitutionMatrixFull form={form} reportId={reportId} editable={false} />}
      {code === 'MONTHLY' && <MonthlyForm form={form} editable={false} reportId={reportId} onSave={noop} />}
    </div>
  );
}