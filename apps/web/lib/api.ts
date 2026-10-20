// apps/web/lib/api.ts
'use client';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:4000/api/v1';

let csrfToken: string | null = null;

async function ensureCsrf() {
  if (csrfToken) return csrfToken;
  const res = await fetch(`${API_BASE}/auth/csrf`, { credentials: 'include' });
  const data = await res.json();
  csrfToken = data.csrfToken;
  return csrfToken;
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> ?? {}),
  };
  if (method !== 'GET') headers['x-csrf-token'] = await ensureCsrf();

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${text}`);
  }
  return res.json();
}