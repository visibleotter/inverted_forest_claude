import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const COURSE_KEYS = ['course1', 'course2', 'course3', 'course4', 'course5']
const HIGHLIGHT_KEYS = ['highlight1', 'highlight2', 'highlight3', 'highlight4', 'highlight5']

export default function About() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-navy text-cream py-16">
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-display text-4xl sm:text-5xl font-bold">
            {t('about.page_title')}
          </h1>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
          {/* Photo column */}
          <div className="lg:col-span-2">
            {/* Photo placeholder */}
            <div className="aspect-[3/4] bg-navyLight rounded-card flex flex-col items-center justify-center text-cream/40 max-w-xs mx-auto lg:mx-0">
              <svg
                className="w-24 h-24 mb-3"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
              <span className="text-sm font-medium text-cream/50">
                {t('about.photo_alt')}
              </span>
            </div>
          </div>

          {/* Bio column */}
          <div className="lg:col-span-3 space-y-5">
            <p className="text-navy/80 leading-relaxed">{t('about.bio_p1')}</p>
            <p className="text-navy/80 leading-relaxed">{t('about.bio_p2')}</p>
            <p className="text-navy/80 leading-relaxed">{t('about.bio_p3')}</p>

            {/* Highlights */}
            <div className="pt-4">
              <h2 className="font-display font-bold text-navy text-xl mb-4">
                {t('about.highlights_title')}
              </h2>
              <ul className="space-y-2.5">
                {HIGHLIGHT_KEYS.map((key) => (
                  <li key={key} className="flex items-start gap-3 text-sm text-navy/80">
                    <span className="mt-0.5 text-amber shrink-0">✓</span>
                    {t(`about.${key}`)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* My courses */}
        <div className="mt-16 border-t border-navy/10 pt-12">
          <h2 className="font-display font-bold text-navy text-2xl mb-6 text-center">
            {t('about.my_courses_title')}
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {COURSE_KEYS.map((key) => (
              <Link
                key={key}
                to="/courses"
                className="bg-white border border-navy/10 rounded-btn px-4 py-2 text-sm font-medium text-navy hover:border-amber hover:text-amber transition-colors shadow-sm"
              >
                {t(`courses.${key}_title`)}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
