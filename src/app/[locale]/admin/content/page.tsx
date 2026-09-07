import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server';
import {
  ContentEditor,
  NamespaceNav,
  type ContentGroup,
  type NamespaceItem
} from '@/components/admin/content-editor';
import {
  contentPlaces,
  groupKeys,
  placeFor,
  resolvePath
} from '@/lib/content/locations';
import {
  flattenMessages,
  loadDefaults,
  loadOverrides
} from '@/lib/content/messages';
import { getData, isDemoMode } from '@/lib/data';
import type { Locale } from '@/lib/types';
import { lt } from '@/lib/utils';

/**
 * Edit every visible string on the site.
 *
 * The catalogue in `src/messages` decides which keys exist; this page only
 * lets their values be changed, and stores only what was actually changed.
 * That is why a key can never be invented here and why clearing a field
 * restores the shipped wording rather than blanking the page.
 *
 * Arrangement comes from `content/locations.ts`, which says where on the
 * site each string is read and which strings stand next to it. Keys the
 * map has not been told about still appear — under "everything else" —
 * so adding a string to the catalogue can never make it uneditable.
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
  const l = (await getLocale()) as Locale;
  const t = await getTranslations('admin.content');

  const [defaultsRu, defaultsEn, overridesRu, overridesEn] = await Promise.all([
    loadDefaults('ru'),
    loadDefaults('en'),
    loadOverrides('ru'),
    loadOverrides('en')
  ]);

  const flatRu = flattenMessages(defaultsRu);
  const flatEn = flattenMessages(defaultsEn);
  const allKeys = Object.keys(flatRu);

  const describe = (name: string): NamespaceItem => {
    const keys = allKeys.filter((key) => key.startsWith(`${name}.`));
    const place = placeFor(name);
    return {
      name,
      title: place ? lt(place.title, l) : name,
      area: place?.area ?? 'service',
      count: keys.length,
      edited: keys.filter(
        (key) => overridesRu[key] !== undefined || overridesEn[key] !== undefined
      ).length
    };
  };

  // Map order first, so the list reads like the site; anything the map has
  // not heard of is appended rather than dropped.
  const mapped = contentPlaces.map((place) => place.namespace);
  const namespaces = [
    ...mapped,
    ...Object.keys(defaultsRu).filter((name) => !mapped.includes(name))
  ]
    .map(describe)
    .filter((ns) => ns.count > 0);

  const current =
    searchParams.ns && namespaces.some((ns) => ns.name === searchParams.ns)
      ? searchParams.ns
      : namespaces.some((ns) => ns.name === 'home')
        ? 'home'
        : (namespaces[0]?.name ?? 'home');

  const place = placeFor(current);

  /*
   * The link to the live page needs a real course and group for the two
   * namespaces whose address is not fixed. Fetched only when the current
   * page actually needs them — this is otherwise two queries per visit for
   * a link nobody asked for.
   */
  const needsSlug = place?.path?.includes('{slug}') ?? false;
  const needsGroup = place?.path?.includes('{groupId}') ?? false;
  const data = getData();
  const [courses, groups] = await Promise.all([
    needsSlug ? data.getCourses() : Promise.resolve([]),
    needsGroup ? data.getAllGroups() : Promise.resolve([])
  ]);
  const path = resolvePath(place, {
    slug: courses[0]?.slug,
    groupId: groups[0]?.id
  });

  const labels = allKeys
    .filter((key) => key.startsWith(`${current}.`))
    .map((key) => key.slice(current.length + 1));

  const contentGroups: ContentGroup[] = groupKeys(current, labels).map(
    (group) => ({
      id: group.id,
      title: lt(group.title, l),
      hint: group.hint ? lt(group.hint, l) : undefined,
      hidden: group.hidden,
      rows: group.keys.map((label) => {
        const key = `${current}.${label}`;
        return {
          key,
          label,
          defaultRu: flatRu[key] ?? '',
          defaultEn: flatEn[key] ?? '',
          ru: overridesRu[key] ?? flatRu[key] ?? '',
          en: overridesEn[key] ?? flatEn[key] ?? ''
        };
      })
    })
  );

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

      <ContentEditor
        namespace={current}
        place={{
          title: place ? lt(place.title, l) : current,
          where: place ? lt(place.where, l) : t('unmapped'),
          href: path ? `/${locale}${path === '/' ? '' : path}` : undefined
        }}
        groups={contentGroups}
      />
    </div>
  );
}
