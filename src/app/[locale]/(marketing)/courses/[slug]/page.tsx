import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { AccordionItem } from '@/components/ui/accordion';
import { Section } from '@/components/ui/section';
import { CourseArt } from '@/components/marketing/course-art';
import {
  GroupPicker,
  type PickerGroup
} from '@/components/marketing/group-picker';
import { siteConfig } from '@/lib/config';
import { getData } from '@/lib/data';
import type { Locale, StudyGroup } from '@/lib/types';
import { seatsRemaining } from '@/lib/types';
import { formatDate, formatPrice, lt, weekdayName } from '@/lib/utils';

interface Props {
  params: { locale: string; slug: string };
  searchParams: { group?: string };
}

export async function generateMetadata({
  params: { locale, slug }
}: Props): Promise<Metadata> {
  const course = await getData().getCourseBySlug(slug);
  if (!course) return {};
  const l = locale as Locale;
  return {
    title: lt(course.title, l),
    description: lt(course.shortDescription, l),
    alternates: {
      canonical: `/${locale}/courses/${slug}`,
      languages: { ru: `/ru/courses/${slug}`, en: `/en/courses/${slug}` }
    },
    openGraph: {
      title: lt(course.title, l),
      description: lt(course.shortDescription, l),
      images: course.imageUrl ? [course.imageUrl] : undefined
    }
  };
}

/**
 * One course: what it is, then the choice of group with the price beside
 * the single button, then everything a careful reader wants to check.
 *
 * The decision comes before the detail on purpose. People arrive here from
 * a Telegram post that already sold them the subject; what they need next
 * is the time, the price and the button. The description, programme and
 * teacher follow for those who read before they commit.
 */
export default async function CoursePage({
  params: { locale, slug },
  searchParams
}: Props) {
  setRequestLocale(locale);
  const l = locale as Locale;
  const data = getData();

  const course = await data.getCourseBySlug(slug);
  if (!course || course.status !== 'published') notFound();

  const [teacher, groups, t, tCourses, tSchedule] = await Promise.all([
    data.getTeacherById(course.teacherId),
    data.getGroupsForCourse(course.id),
    getTranslations('course'),
    getTranslations('courses'),
    getTranslations('schedule')
  ]);

  const title = lt(course.title, l);
  const price = formatPrice(course.monthlyPrice, course.currency, l);
  const months = tCourses('months', { count: course.durationMonths });

  const visible = groups.filter((group) =>
    ['enrolling', 'full', 'in_progress'].includes(group.status)
  );
  const isOpen = (group: StudyGroup) =>
    group.status === 'enrolling' && seatsRemaining(group) > 0;
  const capacity = visible.length
    ? Math.max(...visible.map((group) => group.capacity))
    : null;

  const capitalise = (value: string) =>
    value.charAt(0).toLocaleUpperCase(l) + value.slice(1);

  const pickerGroups: PickerGroup[] = visible.map((group) => ({
    id: group.id,
    day: capitalise(weekdayName(group.weekday, l)),
    time: group.time,
    timezone: group.timezone,
    weekday: group.weekday,
    referenceDate: group.startDate,
    audience: tCourses(`ageGroup.${group.audience}`),
    status: !group.startDateConfirmed
      ? tSchedule('startsWhenFull')
      : tSchedule('startsOn', { date: formatDate(group.startDate, l) }),
    note:
      group.audience === 'adults' ? undefined : tSchedule('audience.childrenNote'),
    open: isOpen(group),
    closedLabel:
      group.status === 'in_progress'
        ? tSchedule('runningSince', { date: formatDate(group.startDate, l) })
        : tSchedule('full')
  }));

  // `?group=` from a Telegram post or the Back button preselects a group,
  // but only one that can actually be joined.
  const requested = searchParams.group;
  const initialId =
    requested &&
    pickerGroups.some((group) => group.id === requested && group.open)
      ? requested
      : null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: title,
    description: lt(course.shortDescription, l),
    inLanguage: locale,
    provider: {
      '@type': 'Organization',
      name: siteConfig.name,
      url: siteConfig.url
    },
    offers: {
      '@type': 'Offer',
      price: course.monthlyPrice,
      priceCurrency: course.currency,
      category: 'Subscription'
    }
  };

  const facts: [string, string][] = [
    [t('factDuration'), months],
    [t('factClasses'), t('factClassesValue')]
  ];
  if (capacity) facts.push([t('factGroup'), t('factGroupValue', { capacity })]);
  if (teacher) facts.push([t('factTeacher'), lt(teacher.name, l)]);

  const list =
    'mt-4 list-disc space-y-2 pl-5 text-[15px] text-muted-foreground marker:text-muted-foreground';

  return (
    <div className="pb-24 lg:pb-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="container-content grid gap-10 pb-12 pt-8 sm:pt-12 lg:grid-cols-[1fr_380px] lg:gap-16">
        <div className="min-w-0">
          <Link
            href="/courses"
            className="text-[15px] text-accent underline-offset-4 hover:underline"
          >
            ← {t('backToCourses')}
          </Link>
          <h1 className="mt-5 text-balance text-[34px] leading-[1.15] sm:text-[44px]">
            {title}
          </h1>
          <p className="text-body mt-4 max-w-prose text-muted-foreground">
            {lt(course.shortDescription, l)}
          </p>
          <dl className="mt-8 grid max-w-prose grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-[15px]">
            {facts.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-muted-foreground">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <CourseArt
          src={course.imageUrl}
          alt={title}
          locale={l}
          priority
          sizes="(max-width: 1024px) 100vw, 380px"
        />
      </section>

      <section
        id="schedule"
        className="container-content grid scroll-mt-20 border-t border-border pb-12 pt-10 lg:grid-cols-[1fr_380px] lg:gap-16 lg:pb-[72px]"
      >
        <GroupPicker
          groups={pickerGroups}
          initialId={initialId}
          locale={l}
          labels={{
            title: t('scheduleTitle'),
            timezoneNote: tSchedule('timezoneNote'),
            holidaysNote: tSchedule('holidaysNote'),
            price,
            perMonth: tCourses('perMonth'),
            priceTerms: t('priceTerms', { months }),
            refund: t('priceRefund'),
            join: t('joinGroup'),
            joinShort: t('registerCta'),
            noneOpen: tSchedule('noneOpen'),
            contact: t('contactUs')
          }}
        />
      </section>

      <Section title={t('aboutTitle')}>
        <div className="grid gap-12 lg:grid-cols-[1fr_380px] lg:gap-16">
          <div className="min-w-0">
            <p className="text-body max-w-prose">{lt(course.description, l)}</p>
            <h3 className="mt-10 text-[21px]">{t('outcomesTitle')}</h3>
            <ul className="text-body mt-4 max-w-prose list-disc space-y-2 pl-5 marker:text-muted-foreground">
              {course.outcomes[l].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="min-w-0">
            <h3 className="text-[21px]">{t('audienceTitle')}</h3>
            <ul className={list}>
              {course.audience[l].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <h3 className="mt-10 text-[21px]">{t('formatTitle')}</h3>
            <ul className={list}>
              {[t('format1'), t('format2'), t('format3'), t('format4')].map(
                (item) => (
                  <li key={item}>{item}</li>
                )
              )}
            </ul>
            {course.publicTelegramUrl && (
              <a
                href={course.publicTelegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-block text-[15px] text-accent underline underline-offset-4"
              >
                {t('telegramPublic')}
              </a>
            )}
          </div>
        </div>
      </Section>

      <Section title={t('curriculumTitle')}>
        <ol className="grid max-w-prose gap-8">
          {course.curriculum.map((module, i) => (
            <li key={i}>
              <p className="text-sm text-muted-foreground">
                {t('moduleLabel', { number: i + 1 })}
              </p>
              <h3 className="mt-1 text-[21px]">{lt(module.title, l)}</h3>
              <ul className={list.replace('mt-4', 'mt-3')}>
                {module.topics[l].map((topic) => (
                  <li key={topic}>{topic}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </Section>

      {teacher && (
        <Section title={t('teacherTitle')}>
          <div className="max-w-prose">
            <h3 className="text-[24px]">{lt(teacher.name, l)}</h3>
            <p className="mt-1 text-[15px] text-muted-foreground">
              {lt(teacher.title, l)}
            </p>
            <p className="text-body mt-4">{lt(teacher.bio, l)}</p>
          </div>
        </Section>
      )}

      {course.faq.length > 0 && (
        <Section title={t('faqTitle')}>
          <div className="max-w-prose border-t border-border">
            {course.faq.map((item, i) => (
              <AccordionItem
                key={i}
                question={lt(item.question, l)}
                answer={lt(item.answer, l)}
              />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
