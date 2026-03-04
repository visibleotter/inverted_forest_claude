import { useTranslation } from 'react-i18next'

// Replace with real phone/handle before going live
const WHATSAPP_NUMBER = 'PHONENUMBER' // e.g. 79001234567 (no + or spaces)
const TELEGRAM_HANDLE = 'YOURHANDLE'  // e.g. invertedforest

export default function Contact() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-navy text-cream py-16">
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4">
            {t('contact.page_title')}
          </h1>
          <p className="text-cream/70 max-w-xl mx-auto leading-relaxed text-balance">
            {t('contact.intro')}
          </p>
        </div>
      </div>

      {/* CTA buttons */}
      <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex flex-col gap-4">
          {/* WhatsApp */}
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#1EBA59] text-white font-semibold text-lg px-8 py-5 rounded-card shadow-md transition-colors duration-200"
          >
            <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
            {t('contact.whatsapp_btn')}
          </a>

          {/* Telegram */}
          <a
            href={`https://t.me/${TELEGRAM_HANDLE}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 bg-[#2AABEE] hover:bg-[#1A98D9] text-white font-semibold text-lg px-8 py-5 rounded-card shadow-md transition-colors duration-200"
          >
            <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current" aria-hidden="true">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
            {t('contact.telegram_btn')}
          </a>
        </div>

        {/* Email fallback */}
        <div className="mt-10 text-center text-navy/60 text-sm">
          <span className="font-medium text-navy/80">{t('contact.email_label')}</span>{' '}
          <a
            href={`mailto:${t('contact.email_placeholder')}`}
            className="text-amber hover:underline underline-offset-4"
          >
            {t('contact.email_placeholder')}
          </a>
        </div>

        <p className="mt-6 text-center text-navy/50 text-xs leading-relaxed">
          {t('contact.note')}
        </p>
      </div>
    </div>
  )
}
