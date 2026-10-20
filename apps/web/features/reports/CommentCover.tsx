// apps/web/features/reports/CommentCover.tsx
'use client';
export function CommentCover({ month, session }: { month: string; session: string }) {
  return (
    <div className="relative bg-white rounded shadow overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-3 bg-slate-700" />
      <div className="p-10 space-y-6">
        <p className="text-center font-bold">প্রাইম ইনস্টিটিউট আদর্শ থানা শাখা</p>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-blue-700" />
          <div className="text-xl font-bold text-blue-800">মাসিক রিপোর্ট</div>
          <div className="w-0 h-0 border-y-8 border-y-transparent border-l-[16px] border-l-blue-700" />
        </div>
        <div className="flex justify-between text-sm pt-32">
          <span>মাসঃ {month || '—'}</span>
          <span>সালঃ {session || '—'} ইং</span>
        </div>
      </div>
    </div>
  );
}