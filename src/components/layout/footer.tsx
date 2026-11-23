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
    <footer className="surface-dark bg-forest text-paper">
      <div className="container-content grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-serif text-lg font-semibold">Inverted Forest</p>
          <p className="mt-3 max-w-xs text-sm text-paper/70">{t('tagline')}</p>
        </div>

        <nav aria-label={t('coursesTitle')}>
          <p className="mb-4 text-sm font-medium text-glow">
            {t('coursesTitle')}
          </p>
          <ul className="space-y-2 text-sm">
            {courses.slice(0, 5).map((course) => (
              <li key={course.id}>
                <Link
                  href={`/courses/${course.slug}`}
                  className="text-paper/80 transition-colors hover:text-paper"
                >
                  {lt(course.title, locale)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label={t('schoolTitle')}>
          <p className="mb-4 text-sm font-medium text-glow">
            {t('schoolTitle')}
          </p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/about" className="text-paper/80 hover:text-paper">
                {tNav('about')}
              </Link>
            </li>
            <li>
              <Link href="/faq" className="text-paper/80 hover:text-paper">
                {tNav('faq')}
              </Link>
            </li>
            <li>
              <Link href="/contacts" className="text-paper/80 hover:text-paper">
                {tNav('contacts')}
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label={t('legalTitle')}>
          <p className="mb-4 text-sm font-medium text-glow">
            {t('legalTitle')}
          </p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/privacy" className="text-paper/80 hover:text-paper">
                {t('privacy')}
              </Link>
            </li>
            <li>
              <Link href="/terms" className="text-paper/80 hover:text-paper">
                {t('terms')}
              </Link>
            </li>
            <li>
              <ManageCookiesLink />
            </li>
            <li>
              <a
                href={`mailto:${siteConfig.contactEmail}`}
                className="text-paper/80 hover:text-paper"
              >
                {siteConfig.contactEmail}
              </a>
            </li>
          </ul>
        </nav>
      </div>

      <div className="border-t border-paper/10">
        <div className="container-content py-6 text-sm text-paper/60">
          {t('copyright', { year: new Date().getFullYear() })}
        </div>
      </div>
    </footer>
  );
}
