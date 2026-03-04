import { useTranslation } from 'react-i18next'

// Detect Capacitor native environment
const isNative = () =>
  typeof window !== 'undefined' &&
  window.Capacitor?.isNativePlatform?.() === true

// Samples data — replace VIDEO_ID with real IDs when available
const SAMPLES = [
  {
    key: 'sample1',
    lang: 'ru',
    type: 'youtube',
    videoId: 'dQw4w9WgXcQ', // placeholder
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  },
  {
    key: 'sample2',
    lang: 'ru',
    type: 'youtube',
    videoId: 'dQw4w9WgXcQ',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  },
  {
    key: 'sample3',
    lang: 'en',
    type: 'youtube',
    videoId: 'dQw4w9WgXcQ',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  },
  {
    key: 'sample4',
    lang: 'ru',
    type: 'youtube',
    videoId: 'dQw4w9WgXcQ',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  },
  {
    key: 'sample5',
    lang: 'en',
    type: 'youtube',
    videoId: 'dQw4w9WgXcQ',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  },
  {
    key: 'sample6',
    lang: 'en',
    type: 'youtube',
    videoId: 'dQw4w9WgXcQ',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  },
]

function SampleCard({ sample }) {
  const { t } = useTranslation()
  const native = isNative()
  const langLabel = sample.lang === 'ru' ? t('samples.tag_ru') : t('samples.tag_en')

  const embedSrc =
    sample.type === 'youtube'
      ? `https://www.youtube.com/embed/${sample.videoId}`
      : `https://player.vimeo.com/video/${sample.videoId}`

  const watchLabel =
    sample.type === 'youtube'
      ? t('samples.watch_on_youtube')
      : t('samples.watch_on_vimeo')

  return (
    <article className="bg-white rounded-card border border-navy/8 shadow-sm overflow-hidden">
      {native ? (
        /* Capacitor native: link-out button instead of iframe */
        <div className="aspect-video bg-navy/5 flex flex-col items-center justify-center gap-3 p-6">
          <span className="text-4xl">▶️</span>
          <a
            href={sample.url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-amber text-white font-semibold px-6 py-2.5 rounded-btn text-sm hover:bg-amberLight transition-colors"
          >
            {watchLabel}
          </a>
        </div>
      ) : (
        <div className="aspect-video">
          <iframe
            src={embedSrc}
            title={t(`samples.${sample.key}_title`)}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            className="w-full h-full"
          />
        </div>
      )}
      <div className="p-4 flex items-center justify-between gap-2">
        <h3 className="font-display font-semibold text-navy text-sm leading-snug">
          {t(`samples.${sample.key}_title`)}
        </h3>
        <span
          className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${
            sample.lang === 'ru'
              ? 'bg-navy/10 text-navy'
              : 'bg-amber/15 text-amber'
          }`}
        >
          {langLabel}
        </span>
      </div>
    </article>
  )
}

export default function Samples() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-navy text-cream py-16">
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4">
            {t('samples.page_title')}
          </h1>
          <p className="text-cream/70 max-w-xl mx-auto leading-relaxed">
            {t('samples.page_intro')}
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {SAMPLES.map((sample) => (
            <SampleCard key={sample.key} sample={sample} />
          ))}
        </div>
      </div>
    </div>
  )
}
