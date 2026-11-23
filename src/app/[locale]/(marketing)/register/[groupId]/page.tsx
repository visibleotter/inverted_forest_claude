import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { RegistrationForm } from '@/components/forms/registration-form';
import { getData } from '@/lib/data';
import type { Locale } from '@/lib/types';
import { seatsRemaining } from '@/lib/types';
import { formatDate, formatPrice, lt, weekdayName } from '@/lib/utils';

interface Props {
  params: { locale: string; groupId: string };
  searchParams: { payment?: string };
}

export async function generateMetadata({
  params: { locale }
}: Props): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'meta' });
  return { title: t('register.title'), robots: { index: false } };
}

/**
 * Step two of three: Group → Details → Payment.
 *
 * What is being bought sits above the form on every screen size — the old
 * page put it after the form on phones, so people typed their details
 * before seeing what they were signing up for. "Change" goes back to the
 * course with this group still selected.
 *
 * Allpay sends a payer who did not finish back here with
 * `?payment=cancelled`; the form then says so and, from the draft it keeps
 * in the browser, comes back filled in.
 */
export default async function RegisterPage({
  params: { locale, groupId },
  searchParams
}: Props) {
  setRequestLocale(locale);
  const l = locale as Locale;
  const data = getData();

  const group = await data.getGroupById(groupId);
  if (!group) notFound();
  const course = await data.getCourseById(group.courseId);
  // Hiding a course has to close its slots too, or the catalogue says one
  // thing and a bookmarked registration link says another.
  if (!course || course.status !== 'published') notFound();

  const [t, tCourses, tSchedule] = await Promise.all([
    getTranslations('register'),
    getTranslations('courses'),
    getTranslations('schedule')
  ]);

  const isOpen = group.status === 'enrolling' && seatsRemaining(group) > 0;
  const title = lt(course.title, l);
  const day = weekdayName(group.weekday, l);
  const when = `${day.charAt(0).toLocaleUpperCase(l)}${day.slice(1)}, ${group.time}`;
  const price = formatPrice(course.monthlyPrice, course.currency, l);
  const backHref = `/courses/${course.slug}?group=${group.id}`;
  const start = group.startDateConfirmed
    ? formatDate(group.startDate, l)
    : tSchedule('startsWhenFull');

  const steps = [t('stepGroup'), t('stepDetails'), t('stepPayment')];

  const summary: [string, string][] = [
    [t('course'), title],
    [t('group'), tCourses(`ageGroup.${group.audience}`)],
    [t('schedule'), when],
    [t('start'), start],
    [t('duration'), tCourses('months', { count: course.durationMonths })],
    [t('price'), `${price} ${tCourses('perMonth')}`]
  ];

  return (
    <div className="container-content pb-20 pt-8 sm:pt-12">
      <nav aria-label={t('stepsLabel')}>
        <ol className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          {steps.map((step, i) => (
            <li key={step} className="flex items-center gap-3">
              {i === 0 ? (
                <Link href={backHref} className="underline underline-offset-4 hover:text-foreground">
                  {step}
                </Link>
              ) : (
                <span
                  aria-current={i === 1 ? 'step' : undefined}
                  className={i === 1 ? 'font-medium text-foreground' : undefined}
                >
                  {step}
                </span>
              )}
              {i < steps.length - 1 && <span aria-hidden>→</span>}
            </li>
          ))}
        </ol>
      </nav>

      <h1 className="mt-6 text-balance text-[34px] leading-[1.15] sm:text-[44px]">
        {t('title')}
      </h1>

      <p className="mt-4 max-w-prose border-l-2 border-fern bg-card px-4 py-3 text-[15px] leading-relaxed">
        <span className="font-serif text-[17px] font-medium">{title}</span>
        <span className="text-muted-foreground">
          {' '}· {when} · {tCourses(`ageGroup.${group.audience}`)} · {price} {tCourses('perMonth')}
        </span>{' '}
        <Link href={backHref} className="whitespace-nowrap text-accent underline underline-offset-4">
          {t('change')}
        </Link>
      </p>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_340px] lg:gap-16">
        <div className="min-w-0 max-w-prose">
          {isOpen ? (
            <RegistrationForm
              groupId={group.id}
              audience={group.audience}
              paymentCancelled={searchParams.payment === 'cancelled'}
            />
          ) : (
            <div className="border border-border bg-card p-6">
              <p className="text-body">{t('groupFull')}</p>
              <Link
                href={`/courses/${course.slug}#schedule`}
                className="mt-4 inline-block text-accent underline underline-offset-4"
              >
                {t('backToCourse')}
              </Link>
            </div>
          )}
        </div>

        <aside className="min-w-0">
          <div className="border border-border bg-card p-6">
            <h2 className="text-[21px]">{t('summaryTitle')}</h2>
            <dl className="mt-5 grid gap-3 text-[15px]">
              {summary.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-sm text-muted-foreground">{label}</dt>
                  <dd className="mt-0.5">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 border-t border-border pt-5">
              <p className="text-[15px] font-medium">{t('afterPayment')}</p>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground marker:text-muted-foreground">
                {[1, 2].map((i) => (
                  <li key={i}>{t(`afterPayment${i}` as 'afterPayment1')}</li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
