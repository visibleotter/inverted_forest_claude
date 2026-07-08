import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AdminTable } from '@/components/admin/admin-table';
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
      <h1 className="mb-6 text-2xl font-semibold">{t('nav.teachers')}</h1>
      <AdminTable
        headers={[t('table.name'), t('table.title'), t('table.groups')]}
        rows={teachers.map((teacher) => [
          <div key="n">
            <p className="font-medium">{teacher.name.ru}</p>
            <p className="text-xs text-muted-foreground">{teacher.name.en}</p>
          </div>,
          <div key="t">
            <p>{teacher.title.ru}</p>
            <p className="text-xs text-muted-foreground">{teacher.title.en}</p>
          </div>,
          String(courses.filter((c) => c.teacherId === teacher.id).length)
        ])}
      />
    </div>
  );
}
