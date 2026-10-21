// apps/web/components/ErrorState.tsx
'use client';
import Link from 'next/link';

type Variant = 'not-found' | 'error';

const COPY: Record<Variant, { title: string; subtitle: string; emoji: string }> = {
  'not-found': {
    title: 'পৃষ্ঠা পাওয়া যায়নি',
    subtitle: 'আপনি যে পৃষ্ঠাটি খুঁজছেন সেটি নেই বা সরিয়ে ফেলা হয়েছে।',
    emoji: '🔍',
  },
  'error': {
    title: 'কিছু একটা ভুল হয়েছে',
    subtitle: 'অপ্রত্যাশিত একটি সমস্যা ঘটেছে। আবার চেষ্টা করুন অথবা ড্যাশবোর্ডে ফিরে যান।',
    emoji: '⚠️',
  },
};

export function ErrorState({
  variant,
  error,
  onRetry,
}: {
  variant: Variant;
  error?: Error & { digest?: string };
  onRetry?: () => void;
}) {
  const c = COPY[variant];
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-8 text-center space-y-4">
        <div className="text-4xl">{c.emoji}</div>
        <h1 className="text-xl font-bold text-emerald">{c.title}</h1>
        <p className="text-sm text-gray-600">{c.subtitle}</p>
        {error?.message && process.env.NODE_ENV !== 'production' && (
          <pre className="text-xs bg-gray-50 text-left p-2 rounded overflow-x-auto whitespace-pre-wrap">
            {error.message}
          </pre>
        )}
        <div className="flex justify-center gap-2 pt-2">
          {onRetry && (
            <button onClick={onRetry} className="bg-emerald text-white px-4 py-2 rounded text-sm">
              আবার চেষ্টা
            </button>
          )}
          <Link href="/dashboard" className="border px-4 py-2 rounded text-sm">
            ড্যাশবোর্ড
          </Link>
          <Link href="/login" className="border px-4 py-2 rounded text-sm">
            লগইন
          </Link>
        </div>
      </div>
    </div>
  );
}