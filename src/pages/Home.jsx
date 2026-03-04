import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const COURSE_KEYS = ['course1', 'course2', 'course3', 'course4', 'course5']
const COURSE_TAGS = ['tag_adults_teens', 'tag_adults_kids', 'tag_adults', 'tag_adults_teens', 'tag_book_club']

function ValueCard({ icon, titleKey, descKey }) {
  const { t } = useTranslation()
  return (
    <div className="bg-white rounded-card p-6 shadow-sm border border-navy/5">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-display font-semibold text-navy text-lg mb-2">{t(titleKey)}</h3>
      <p className="text-navy/70 text-sm leading-relaxed">{t(descKey)}</p>
    </div>
  )
}

export default function Home() {
  const { t } = useTranslation()

  return (
    <>
      {/* Hero */}
      <section className="relative bg-navy text-cream min-h-[90vh] flex items-center overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-amber blur-3xl" />
          <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-amber blur-3xl" />
        </div>
        <div className="relative max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <span className="inline-block text-amber text-xs font-semibold tracking-[0.2em] uppercase mb-6">
            History &amp; Philosophy
          </span>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-balance mb-6">
            {t('home.hero_headline')}
          </h1>
          <p className="text-cream/75 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-10 text-balance">
            {t('home.hero_subline')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/courses"
              className="bg-amber hover:bg-amberLight text-white font-semibold px-8 py-3.5 rounded-btn transition-colors duration-200 text-sm"
            >
              {t('home.cta_courses')}
            </Link>
            <Link
              to="/contact"
              className="border border-cream/40 hover:border-cream text-cream font-semibold px-8 py-3.5 rounded-btn transition-colors duration-200 text-sm"
            >
              {t('home.cta_contact')}
            </Link>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="py-20 bg-cream">
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ValueCard icon="🎓" titleKey="home.value1_title" descKey="home.value1_desc" />
            <ValueCard icon="👨‍👩‍👧" titleKey="home.value2_title" descKey="home.value2_desc" />
            <ValueCard icon="🎬" titleKey="home.value3_title" descKey="home.value3_desc" />
          </div>
        </div>
      </section>

      {/* Course teaser strip */}
      <section className="py-16 bg-white">
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-navy">
              {t('home.courses_teaser_title')}
            </h2>
            <Link
              to="/courses"
              className="text-amber font-semibold text-sm hover:underline underline-offset-4"
            >
              {t('home.courses_teaser_more')} →
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth">
            {COURSE_KEYS.map((key, i) => (
              <div
                key={key}
                className="snap-start shrink-0 w-64 sm:w-72 bg-cream rounded-card p-5 border border-navy/8"
              >
                <span className="inline-block bg-amber/15 text-amber text-xs font-semibold px-2.5 py-1 rounded-full mb-3">
                  {t(`courses.${COURSE_TAGS[i]}`)}
                </span>
                <h3 className="font-display font-semibold text-navy text-base leading-snug">
                  {t(`courses.${key}_title`)}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Instructor preview */}
      <section className="py-20 bg-cream">
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-navy mb-4">
              {t('home.about_teaser_title')}
            </h2>
            <p className="text-navy/70 leading-relaxed mb-6">
              {t('home.about_teaser_text')}
            </p>
            <Link
              to="/about"
              className="inline-block border-2 border-navy text-navy font-semibold px-6 py-3 rounded-btn hover:bg-navy hover:text-cream transition-colors duration-200 text-sm"
            >
              {t('home.about_teaser_link')}
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
