import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { AdminTable } from '@/components/admin/admin-table';
import { buttonVariants } from '@/components/ui/button';
import { getData } from '@/lib/data';

export default async function AdminTeachersPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations('admin');
  const data = getData();
  const [teachers, courses] = await Promise.all([
    data.getTeachers(),
    data.getCourses()
  ]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{t('nav.teachers')}</h1>
        <Link
          href="/admin/teachers/new"
          className={buttonVariants({ variant: 'accent' })}
        >
          {t('teacherForm.new')}
        </Link>
      </div>
      <AdminTable
        headers={[
          t('table.name'),
          t('table.title'),
          t('table.groups'),
          t('actions.title')
        ]}
        rows={teachers.map((teacher) => [
          <Link key="n" href={`/admin/teachers/${teacher.id}`} className="block">
            <p className="font-medium text-accent hover:underline">
              {teacher.name.ru}
            </p>
            <p className="text-xs text-muted-foreground">{teacher.name.en}</p>
          </Link>,
          <div key="t">
            <p>{teacher.title.ru}</p>
            <p className="text-xs text-muted-foreground">{teacher.title.en}</p>
          </div>,
          String(courses.filter((c) => c.teacherId === teacher.id).length),
          <Link
              key="edit"
              href={`/admin/teachers/${teacher.id}`}
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              {t('actions.edit')}
            </Link>
        ])}
      />
    </div>
  );
}
