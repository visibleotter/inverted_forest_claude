import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { isSupabaseConfigured } from '@/lib/config';

export default async function AdminSettingsPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations('admin.settings');

  const integrations = [
    { label: t('supabase'), configured: isSupabaseConfigured() },
    {
      label: t('make'),
      configured: Boolean(process.env.MAKE_REGISTRATION_WEBHOOK_URL)
    },
    {
      label: t('webhookSecret'),
      configured: Boolean(process.env.PAYMENT_WEBHOOK_SECRET)
    }
  ];

  return (
    <div className="max-w-2xl">
      <h1 className="mb-2 text-2xl font-semibold">{t('title')}</h1>
      <p className="mb-6 text-sm text-muted-foreground">{t('intro')}</p>

      <Card>
        <CardContent className="divide-y divide-border p-0">
          {integrations.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between px-5 py-4"
            >
              <span className="text-sm font-medium">{item.label}</span>
              <Badge variant={item.configured ? 'success' : 'warning'}>
                {item.configured ? t('configured') : t('notConfigured')}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <p className="mt-4 text-xs text-muted-foreground">{t('docsNote')}</p>
    </div>
  );
}
