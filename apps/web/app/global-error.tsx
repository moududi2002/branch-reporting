// apps/web/app/global-error.tsx
'use client';
export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="bn">
      <body>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
          <div style={{ textAlign: 'center', padding: 24 }}>
            <h1 style={{ color: '#0f766e' }}>কিছু একটা ভুল হয়েছে</h1>
            <p style={{ fontSize: 14 }}>{error.message}</p>
            <button onClick={reset} style={{ background: '#0f766e', color: 'white', border: 0, padding: '8px 16px', borderRadius: 6 }}>আবার চেষ্টা</button>
          </div>
        </div>
      </body>
    </html>
  );
}