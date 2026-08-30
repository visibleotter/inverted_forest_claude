import { getTranslations } from 'next-intl/server';
import { Badge } from '@/components/ui/badge';

const variantByStatus: Record<
  string,
  'success' | 'warning' | 'danger' | 'default' | 'accent'
> = {
  active: 'success',
  succeeded: 'success',
  enrolling: 'success',
  published: 'success',
  in_progress: 'accent',
  pending: 'warning',
  pending_payment: 'warning',
  past_due: 'danger',
  failed: 'danger',
  cancelled: 'danger',
  full: 'warning',
  refunded: 'default',
  completed: 'default',
  // Telegram access states, which are read alongside payment states in the
  // enrollments table — a paid student who is not in the channel is the
  // thing an admin is actually looking for.
  joined: 'success',
  invite_created: 'accent',
  not_granted: 'warning',
  removed: 'danger',
  expired: 'warning',
  draft: 'default',
  archived: 'default'
};

export async function StatusBadge({ status }: { status: string }) {
  const t = await getTranslations('admin.status');
  return (
    <Badge variant={variantByStatus[status] ?? 'default'}>
      {t.has(status as never) ? t(status as never) : status}
    </Badge>
  );
}
