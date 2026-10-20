// apps/web/features/reports/MetaHeader.tsx
'use client';
export function MetaHeader({ month, session, branchName }: { month?: string; session?: string; branchName?: string }) {
  return (
    <div className="bg-white rounded shadow px-4 py-2 text-sm flex justify-between">
      <span>মাসঃ {month ?? '—'}</span>
      <span>শাখার নামঃ {branchName ?? '—'}</span>
      <span>সেশনঃ {session ?? '—'}</span>
    </div>
  );
}