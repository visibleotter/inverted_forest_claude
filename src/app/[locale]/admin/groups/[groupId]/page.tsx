import { notFound } from 'next/navigation';
import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server';
import { GroupForm } from '@/components/admin/group-form';
import { getData } from '@/lib/data';
import type { Locale } from '@/lib/types';
import { lt } from '@/lib/utils';

/**
 * `/admin/groups/new` creates; `/admin/groups/group_101` edits.
 *
 * One route rather than two, because the form is the same form — the only
 * difference is whether the id field is writable.
 */
export default async function AdminGroupEditPage({
  params: { locale, groupId }
}: {
  params: { locale: string; groupId: string };
}) {
  setRequestLocale(locale);
  const l = (await getLocale()) as Locale;
  const t = await getTranslations('admin.groupForm');
  const data = getData();

  const isNew = groupId === 'new';
  const [group, courses] = await Promise.all([
    isNew ? Promise.resolve(null) : data.getGroupById(groupId),
    data.getCourses()
  ]);

  if (!isNew && !group) notFound();

  // Resolved here: a function cannot be handed to a client component, and
  // the bilingual title record has no business crossing that boundary.
  const courseOptions = courses.map((course) => ({
    id: course.id,
    label: lt(course.title, l)
  }));

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold">
        {isNew ? t('new') : t('edit')}
      </h1>
      {group && (
        <p className="mb-6 font-mono text-sm text-muted-foreground">
          {group.id}
        </p>
      )}
      <div className={group ? '' : 'mt-6'}>
        <GroupForm group={group} courses={courseOptions} />
      </div>
    </div>
  );
}
