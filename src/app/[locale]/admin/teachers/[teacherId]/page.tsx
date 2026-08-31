import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { TeacherForm } from '@/components/admin/teacher-form';
import { getData, isDemoMode } from '@/lib/data';

/** `/admin/teachers/new` creates; `/admin/teachers/teacher_001` edits. */
export default async function AdminTeacherEditPage({
  params: { locale, teacherId }
}: {
  params: { locale: string; teacherId: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations('admin.teacherForm');

  const isNew = teacherId === 'new';
  const teacher = isNew
    ? null
    : await getData().getTeacherById(teacherId);

  if (!isNew && !teacher) notFound();

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold">
        {isNew ? t('new') : t('edit')}
      </h1>
      {teacher && (
        <p className="mb-6 font-mono text-sm text-muted-foreground">
          {teacher.id}
        </p>
      )}

      {isDemoMode() && (
        <p className="mb-6 rounded-card border border-accent/30 bg-accent/10 px-4 py-3 text-sm">
          {t('demoMode')}
        </p>
      )}

      <TeacherForm teacher={teacher} />
    </div>
  );
}
