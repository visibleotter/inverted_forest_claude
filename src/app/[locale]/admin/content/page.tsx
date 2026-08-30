import { getTranslations, setRequestLocale } from 'next-intl/server';
import {
  ContentEditor,
  NamespaceNav,
  type ContentRow
} from '@/components/admin/content-editor';
import {
  flattenMessages,
  loadDefaults,
  loadOverrides
} from '@/lib/content/messages';
import { isDemoMode } from '@/lib/data';

/**
 * Edit every visible string on the site.
 *
 * The catalogue in `src/messages` decides which keys exist; this page only
 * lets their values be changed, and stores only what was actually changed.
 * That is why a key can never be invented here and why clearing a field
 * restores the shipped wording rather than blanking the page.
 *
 * Grouped by namespace because 361 strings on one screen is not an editor,
 * it is a wall.
 */
export const dynamic = 'force-dynamic';

export default async function AdminContentPage({
  params: { locale },
  searchParams
}: {
  params: { locale: string };
  searchParams: { ns?: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations('admin.content');

  const [defaultsRu, defaultsEn, overridesRu, overridesEn] = await Promise.all([
    loadDefaults('ru'),
    loadDefaults('en'),
    loadOverrides('ru'),
    loadOverrides('en')
  ]);

  const flatRu = flattenMessages(defaultsRu);
  const flatEn = flattenMessages(defaultsEn);

  const namespaces = Object.keys(defaultsRu).map((name) => {
    const keys = Object.keys(flatRu).filter((key) =>
      key.startsWith(`${name}.`)
    );
    return {
      name,
      count: keys.length,
      edited: keys.filter(
        (key) => overridesRu[key] !== undefined || overridesEn[key] !== undefined
      ).length
    };
  });

  const current =
    searchParams.ns && namespaces.some((ns) => ns.name === searchParams.ns)
      ? searchParams.ns
      : (namespaces[0]?.name ?? 'home');

  const rows: ContentRow[] = Object.keys(flatRu)
    .filter((key) => key.startsWith(`${current}.`))
    .map((key) => ({
      key,
      label: key.slice(current.length + 1),
      defaultRu: flatRu[key] ?? '',
      defaultEn: flatEn[key] ?? '',
      ru: overridesRu[key] ?? flatRu[key] ?? '',
      en: overridesEn[key] ?? flatEn[key] ?? ''
    }));

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold">{t('title')}</h1>
      <p className="mb-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        {t('intro')}
      </p>

      {isDemoMode() && (
        <p className="mb-6 rounded-card border border-accent/30 bg-accent/10 px-4 py-3 text-sm">
          {t('demoMode')}
        </p>
      )}

      <NamespaceNav
        namespaces={namespaces}
        current={current}
        hrefFor={`/${locale}/admin/content`}
      />

      <ContentEditor namespace={current} rows={rows} />
    </div>
  );
}
