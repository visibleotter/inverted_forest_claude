import { TreePine } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { ManageCookiesLink } from '@/components/consent/manage-cookies-link';
import { getData } from '@/lib/data';
import { siteConfig } from '@/lib/config';
import { lt } from '@/lib/utils';
import type { Locale } from '@/lib/types';

export async function Footer() {
  const t = await getTranslations('footer');
  const tNav = await getTranslations('nav');
  const locale = (await getLocale()) as Locale;
  const courses = await getData().getCourses();

  return (
    <footer className="border-t border-border bg-navy text-cream dark:bg-navy-deep">
      <div className="container-content grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="flex items-center gap-2 font-display text-lg font-semibold">
            <TreePine className="h-5 w-5 rotate-180 text-amber" aria-hidden />
            Inverted Forest
          </p>
          <p className="mt-3 max-w-xs text-sm text-cream/70">{t('tagline')}</p>
        </div>

        <nav aria-label={t('coursesTitle')}>
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-amber">
            {t('coursesTitle')}
          </p>
          <ul className="space-y-2 text-sm">
            {courses.slice(0, 5).map((course) => (
              <li key={course.id}>
                <Link
                  href={`/courses/${course.slug}`}
                  className="text-cream/80 transition-colors hover:text-cream"
                >
                  {lt(course.title, locale)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label={t('schoolTitle')}>
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-amber">
            {t('schoolTitle')}
          </p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/teachers" className="text-cream/80 hover:text-cream">
                {tNav('teachers')}
              </Link>
            </li>
            <li>
              <Link href="/about" className="text-cream/80 hover:text-cream">
                {tNav('about')}
              </Link>
            </li>
            <li>
              <Link href="/faq" className="text-cream/80 hover:text-cream">
                {tNav('faq')}
              </Link>
            </li>
            <li>
              <Link href="/contacts" className="text-cream/80 hover:text-cream">
                {tNav('contacts')}
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label={t('legalTitle')}>
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-amber">
            {t('legalTitle')}
          </p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/privacy" className="text-cream/80 hover:text-cream">
                {t('privacy')}
              </Link>
            </li>
            <li>
              <Link href="/terms" className="text-cream/80 hover:text-cream">
                {t('terms')}
              </Link>
            </li>
            <li>
              <ManageCookiesLink />
            </li>
            <li>
              <a
                href={`mailto:${siteConfig.contactEmail}`}
                className="text-cream/80 hover:text-cream"
              >
                {siteConfig.contactEmail}
              </a>
            </li>
          </ul>
        </nav>
      </div>

      <div className="border-t border-cream/10">
        <div className="container-content py-6 text-sm text-cream/50">
          {t('copyright', { year: new Date().getFullYear() })}
        </div>
      </div>
    </footer>
  );
}
