import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server';
import { AdminTable } from '@/components/admin/admin-table';
import { PaymentActions } from '@/components/admin/payment-actions';
import { StatusBadge } from '@/components/admin/status-badge';
import { getData } from '@/lib/data';
import type { Locale } from '@/lib/types';
import { formatPrice, lt } from '@/lib/utils';

export default async function AdminPaymentsPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const l = (await getLocale()) as Locale;
  const t = await getTranslations('admin');
  const payments = await getData().getPayments();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">{t('nav.payments')}</h1>
      <AdminTable
        headers={[
          t('table.date'),
          t('table.student'),
          t('table.course'),
          t('table.amount'),
          t('table.provider'),
          t('table.status'),
          t('actions.title')
        ]}
        rows={payments.map((payment) => [
          new Date(payment.createdAt).toLocaleDateString(
            l === 'ru' ? 'ru-RU' : 'en-US'
          ),
          <span key="n" className="font-medium">{payment.studentName}</span>,
          lt(payment.courseTitle, l),
          formatPrice(payment.amount, payment.currency, l),
          <span key="p" className="capitalize">{payment.provider}</span>,
          <StatusBadge key="s" status={payment.status} />,
          <PaymentActions
            key="act"
            enrollmentId={payment.enrollmentId}
            refundable={payment.status === 'succeeded'}
          />
        ])}
      />
    </div>
  );
}
