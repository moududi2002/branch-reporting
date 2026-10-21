// apps/web/app/not-found.tsx
import { ErrorState } from '@/components/ErrorState';

export default function NotFound() {
  return <ErrorState variant="not-found" />;
}