// apps/api/src/common/csrf.ts
import { doubleCsrf } from 'csrf-csrf';

export const { generateCsrfToken, validateRequest, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET ?? 'csrf-secret-change-me',
  cookieName: 'x-csrf-token',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  },
  getCsrfTokenFromRequest: (req) => req.headers['x-csrf-token'] as string,
  getSessionIdentifier: (req) => (req as any).user?.id ?? 'anon',
});