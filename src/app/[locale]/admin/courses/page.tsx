import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server';
import { AdminTable } from '@/components/admin/admin-table';
import { StatusBadge } from '@/components/admin/status-badge';
import { getData } from '@/lib/data';
import type { Locale } from '@/lib/types';
import { formatPrice, lt } from '@/lib/utils';

export default async function AdminCoursesPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const l = (await getLocale()) as Locale;
  const t = await getTranslations('admin');
  const data = getData();
  const [courses, teachers, groups] = await Promise.all([
    data.getCourses(),
    data.getTeachers(),
    data.getAllGroups()
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">{t('nav.courses')}</h1>
      <AdminTable
        headers={[
          t('table.title'),
          t('table.teacher'),
          t('table.price'),
          t('table.duration'),
          t('table.groups'),
          t('table.status')
        ]}
        rows={courses.map((course) => {
          const teacher = teachers.find((x) => x.id === course.teacherId);
          const courseGroups = groups.filter((g) => g.courseId === course.id);
          return [
            <div key="t">
              {/* Bilingual side-by-side: source of truth for translators */}
              <p className="font-medium">{course.title.ru}</p>
              <p className="text-xs text-muted-foreground">
                {course.title.en}
              </p>
            </div>,
            teacher ? lt(teacher.name, l) : '—',
            `${formatPrice(course.monthlyPrice, course.currency, l)} / ${
              l === 'ru' ? 'мес' : 'mo'
            }`,
            String(course.durationMonths),
            String(courseGroups.length),
            <StatusBadge key="s" status={course.status} />
          ];
        })}
      />
    </div>
  );
}
