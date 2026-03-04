import { useState } from 'react'
import { useTranslation } from 'react-i18next'

const COURSES = [
  { key: 'course1', tagKey: 'tag_adults_teens', emoji: '🏰' },
  { key: 'course2', tagKey: 'tag_adults_kids', emoji: '🏛️' },
  { key: 'course3', tagKey: 'tag_adults', emoji: '🦉' },
  { key: 'course4', tagKey: 'tag_adults_teens', emoji: '🪨' },
  { key: 'course5', tagKey: 'tag_book_club', emoji: '📖' },
]

function CourseCard({ course }) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)

  return (
    <article className="bg-white rounded-card border border-navy/8 shadow-sm overflow-hidden flex flex-col">
      <div className="p-6 flex-1">
        <div className="flex items-start justify-between gap-3 mb-3">
          <span className="text-3xl" aria-hidden="true">{course.emoji}</span>
          <span className="inline-block bg-amber/15 text-amber text-xs font-semibold px-2.5 py-1 rounded-full shrink-0">
            {t(`courses.${course.tagKey}`)}
          </span>
        </div>
        <h2 className="font-display font-bold text-navy text-xl mb-3 leading-snug">
          {t(`courses.${course.key}_title`)}
        </h2>
        <p className="text-navy/70 text-sm leading-relaxed">
          {t(`courses.${course.key}_desc`)}
        </p>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-navy/8">
            <p className="text-navy/80 text-sm leading-relaxed">
              {t(`courses.${course.key}_detail`)}
            </p>
          </div>
        )}
      </div>
      <div className="px-6 pb-6">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm font-semibold text-amber hover:text-amberLight transition-colors underline underline-offset-4"
        >
          {expanded ? t('courses.close') : t('courses.learn_more')}
        </button>
      </div>
    </article>
  )
}

export default function Courses() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-navy text-cream py-16">
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4">
            {t('courses.page_title')}
          </h1>
          <p className="text-cream/70 max-w-2xl mx-auto leading-relaxed text-balance">
            {t('courses.page_intro')}
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {COURSES.map((course) => (
            <CourseCard key={course.key} course={course} />
          ))}
        </div>
      </div>
    </div>
  )
}
