import { ArrowLeft, Check } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { RegistrationForm } from '@/components/forms/registration-form';
import { getData } from '@/lib/data';
import type { Locale } from '@/lib/types';
import { seatsRemaining } from '@/lib/types';
import { formatDate, formatPrice, lt, weekdayName } from '@/lib/utils';

interface Props {
  params: { locale: string; groupId: string };
}

export async function generateMetadata({
  params: { locale }
}: Props): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'meta' });
  return { title: t('register.title'), robots: { index: false } };
}

export default async function RegisterPage({
  params: { locale, groupId }
}: Props) {
  setRequestLocale(locale);
  const l = locale as Locale;
  const data = getData();

  const group = await data.getGroupById(groupId);
  if (!group) notFound();
  const course = await data.getCourseById(group.courseId);
  if (!course) notFound();

  const [t, tCourses] = await Promise.all([
    getTranslations('register'),
    getTranslations('courses')
  ]);

  const isOpen = group.status === 'enrolling' && seatsRemaining(group) > 0;

  return (
    <div className="container-content py-14 sm:py-20">
      <Link
        href={`/courses/${course.slug}`}
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t('backToCourse')}
      </Link>

      <div className="grid gap-10 lg:grid-cols-[1fr_420px]">
        <div>
          <h1 className="text-balance text-4xl font-semibold">{t('title')}</h1>
          <p className="mt-3 text-muted-foreground">{t('subtitle')}</p>

          <div className="mt-8">
            {isOpen ? (
              <RegistrationForm groupId={group.id} />
            ) : (
              <div className="rounded-card border border-border bg-card p-8">
                <p className="font-medium">{t('groupFull')}</p>
                <Link
                  href={`/courses/${course.slug}#schedule`}
                  className="mt-3 inline-block text-sm font-medium text-amber hover:underline"
                >
                  {t('backToCourse')}
                </Link>
              </div>
            )}
          </div>
        </div>

        <aside>
          <Card>
            <CardContent className="sm:p-7">
              <h2 className="text-lg font-semibold">{t('summaryTitle')}</h2>
              <dl className="mt-5 space-y-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">{t('course')}</dt>
                  <dd className="mt-0.5 font-medium">{lt(course.title, l)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t('group')}</dt>
                  <dd className="mt-0.5 font-medium">
                    {tCourses(`ageGroup.${group.audience}`)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t('schedule')}</dt>
                  <dd className="mt-0.5 font-medium capitalize">
                    {weekdayName(group.weekday, l)} · {group.time}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t('start')}</dt>
                  <dd className="mt-0.5 font-medium">
                    {formatDate(group.startDate, l)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t('duration')}</dt>
                  <dd className="mt-0.5 font-medium">
                    {tCourses('months', { count: course.durationMonths })}
                  </dd>
                </div>
                <div className="border-t border-border pt-4">
                  <dt className="text-muted-foreground">{t('price')}</dt>
                  <dd className="mt-0.5">
                    <span className="font-display text-2xl font-semibold">
                      {formatPrice(course.monthlyPrice, course.currency, l)}
                    </span>{' '}
                    <span className="text-muted-foreground">
                      / {t('priceNote')}
                    </span>
                  </dd>
                </div>
              </dl>

              <div className="mt-6 rounded-btn bg-muted/60 p-4">
                <p className="text-sm font-semibold">{t('afterPayment')}</p>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {[1, 2, 3].map((i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-amber"
                        aria-hidden
                      />
                      {t(`afterPayment${i}` as 'afterPayment1')}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
