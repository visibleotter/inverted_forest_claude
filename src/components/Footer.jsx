import { Link, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function Footer() {
  const { t, i18n } = useTranslation()

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'ru' : 'en')
  }

  const navItems = [
    { key: 'home', to: '/' },
    { key: 'courses', to: '/courses' },
    { key: 'samples', to: '/samples' },
    { key: 'about', to: '/about' },
    { key: 'contact', to: '/contact' },
  ]

  return (
    <footer className="bg-navy text-cream/80 mt-auto">
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <Link to="/" className="inline-flex items-center gap-2 mb-3">
              <svg width="28" height="28" viewBox="0 0 64 64" aria-hidden="true">
                <rect width="64" height="64" rx="10" fill="#C8922A" />
                <polygon
                  points="32,10 50,34 40,34 54,52 10,52 24,34 14,34"
                  fill="#F8F5EF"
                  transform="rotate(180,32,38)"
                />
                <rect x="29" y="48" width="6" height="8" fill="#F8F5EF" />
              </svg>
              <span className="font-display font-semibold text-cream text-base">
                Inverted Forest
              </span>
            </Link>
            <p className="text-sm text-cream/60 leading-relaxed">
              {t('footer.tagline')}
            </p>
          </div>

          {/* Nav links */}
          <div>
            <h3 className="text-xs font-semibold tracking-widest uppercase text-amber mb-4">
              Navigation
            </h3>
            <ul className="space-y-2">
              {navItems.map(({ key, to }) => (
                <li key={key}>
                  <NavLink
                    to={to}
                    end={to === '/'}
                    className={({ isActive }) =>
                      `text-sm transition-colors ${
                        isActive ? 'text-amber' : 'text-cream/70 hover:text-cream'
                      }`
                    }
                  >
                    {t(`nav.${key}`)}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Language & contact */}
          <div>
            <h3 className="text-xs font-semibold tracking-widest uppercase text-amber mb-4">
              Language
            </h3>
            <button
              onClick={toggleLang}
              className="text-sm border border-cream/30 rounded-btn px-4 py-2 text-cream/80 hover:bg-cream/10 transition-colors mb-4"
            >
              {i18n.language === 'en' ? '🇷🇺 Русский' : '🇬🇧 English'}
            </button>
          </div>
        </div>

        <div className="border-t border-cream/10 mt-8 pt-6 text-center text-xs text-cream/40">
          {t('footer.copyright')}
        </div>
      </div>
    </footer>
  )
}
