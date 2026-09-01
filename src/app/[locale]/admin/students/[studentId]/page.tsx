import { notFound } from 'next/navigation';
import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server';
import { StudentForm } from '@/components/admin/student-form';
import { StatusBadge } from '@/components/admin/status-badge';
import { getData, isDemoMode } from '@/lib/data';
import type { Locale } from '@/lib/types';
import { lt } from '@/lib/utils';

/**
 * One student's contact details, with their enrollments listed underneath.
 *
 * The enrollments are read-only here on purpose: acting on one is done
 * from the enrollments table, where the buttons already live. This page
 * answers a different question — who is this person, and is their address
 * right — and showing what they are signed up to is the context that makes
 * "is this the right person" answerable.
 */
export default async function AdminStudentPage({
  params: { locale, studentId }
}: {
  params: { locale: string; studentId: string };
}) {
  setRequestLocale(locale);
  const l = (await getLocale()) as Locale;
  const t = await getTranslations('admin.studentForm');
  const tAdmin = await getTranslations('admin');
  const data = getData();

  const [student, enrollments] = await Promise.all([
    data.getStudentById(studentId),
    data.getEnrollments()
  ]);

  if (!student) notFound();

  const theirs = enrollments.filter((row) => row.studentId === studentId);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="mb-1 text-2xl font-semibold">{t('title')}</h1>
        <p className="mb-6 font-mono text-xs text-muted-foreground">
          {student.id}
        </p>

        {isDemoMode() && (
          <p className="mb-6 rounded-card border border-accent/30 bg-accent/10 px-4 py-3 text-sm">
            {t('demoMode')}
          </p>
        )}

        <StudentForm student={student} />
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">{t('enrollmentsTitle')}</h2>
        {theirs.length === 0 ? (
          <p className="rounded-card border border-border bg-card px-4 py-6 text-sm text-muted-foreground">
            {tAdmin('table.empty')}
          </p>
        ) : (
          <ul className="space-y-3">
            {theirs.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center gap-3 rounded-card border border-border bg-card px-4 py-3 text-sm"
              >
                <span className="font-medium">{lt(row.courseTitle, l)}</span>
                <code className="text-xs text-muted-foreground">
                  {row.groupId}
                </code>
                {row.participantName && (
                  <span className="text-muted-foreground">
                    · {row.participantName}
                  </span>
                )}
                <span className="ml-auto flex items-center gap-2">
                  <StatusBadge status={row.status} />
                  <StatusBadge status={row.telegramAccessStatus} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
