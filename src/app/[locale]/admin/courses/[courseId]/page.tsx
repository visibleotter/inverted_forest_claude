import { notFound } from 'next/navigation';
import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server';
import { CourseForm } from '@/components/admin/course-form';
import { getData } from '@/lib/data';
import { isDemoMode } from '@/lib/data';
import type { Locale } from '@/lib/types';
import { lt } from '@/lib/utils';

/**
 * `/admin/courses/new` creates; `/admin/courses/course_007` edits.
 *
 * In demo mode the courses come from `src/lib/data/seed.ts`, which is code
 * — the form renders and validates, but saving is refused rather than
 * pretending. Connect Supabase and the same form writes for real.
 */
export default async function AdminCourseEditPage({
  params: { locale, courseId }
}: {
  params: { locale: string; courseId: string };
}) {
  setRequestLocale(locale);
  const l = (await getLocale()) as Locale;
  const t = await getTranslations('admin.courseForm');
  const data = getData();

  const isNew = courseId === 'new';
  const [course, teachers] = await Promise.all([
    isNew ? Promise.resolve(null) : data.getCourseById(courseId),
    data.getTeachers()
  ]);

  if (!isNew && !course) notFound();

  const teacherOptions = teachers.map((teacher) => ({
    id: teacher.id,
    label: lt(teacher.name, l)
  }));

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold">
        {isNew ? t('new') : t('edit')}
      </h1>
      {course && (
        <p className="mb-6 font-mono text-sm text-muted-foreground">
          {course.id}
        </p>
      )}

      {isDemoMode() && (
        <p className="mb-6 rounded-card border border-accent/30 bg-accent/10 px-4 py-3 text-sm">
          {t('demoMode')}
        </p>
      )}

      <CourseForm course={course} teachers={teacherOptions} />
    </div>
  );
}
