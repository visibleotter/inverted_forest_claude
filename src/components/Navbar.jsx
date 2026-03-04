import { useState, useEffect } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function Navbar() {
  const { t, i18n } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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

  const linkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors duration-200 ${
      isActive ? 'text-amber' : 'text-navy hover:text-amber'
    }`

  return (
    <header
      className={`sticky top-0 z-50 bg-cream transition-shadow duration-300 ${
        scrolled ? 'shadow-md' : 'shadow-none'
      }`}
    >
      <nav className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <svg width="32" height="32" viewBox="0 0 64 64" aria-hidden="true">
              <rect width="64" height="64" rx="10" fill="#1B2A4A" />
              <polygon
                points="32,10 50,34 40,34 54,52 10,52 24,34 14,34"
                fill="#C8922A"
                transform="rotate(180,32,38)"
              />
              <rect x="29" y="48" width="6" height="8" fill="#C8922A" />
            </svg>
            <span className="font-display font-semibold text-navy text-lg leading-tight">
              Inverted Forest
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map(({ key, to }) => (
              <NavLink key={key} to={to} className={linkClass} end={to === '/'}>
                {t(`nav.${key}`)}
              </NavLink>
            ))}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleLang}
              className="text-xs font-semibold tracking-widest border border-navy/30 rounded-btn px-3 py-1.5 text-navy hover:bg-navy hover:text-cream transition-colors duration-200"
              aria-label="Toggle language"
            >
              {i18n.language === 'en' ? 'РУ' : 'EN'}
            </button>

            {/* Hamburger */}
            <button
              className="md:hidden p-1.5 rounded text-navy hover:text-amber transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              <span className="block w-5 h-0.5 bg-current mb-1 transition-transform duration-200" style={menuOpen ? { transform: 'translateY(6px) rotate(45deg)' } : {}} />
              <span className="block w-5 h-0.5 bg-current mb-1 transition-opacity duration-200" style={menuOpen ? { opacity: 0 } : {}} />
              <span className="block w-5 h-0.5 bg-current transition-transform duration-200" style={menuOpen ? { transform: 'translateY(-6px) rotate(-45deg)' } : {}} />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-navy/10 py-3 pb-4 flex flex-col gap-1">
            {navItems.map(({ key, to }) => (
              <NavLink
                key={key}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `block px-2 py-2 rounded text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-amber bg-amber/10'
                      : 'text-navy hover:text-amber hover:bg-amber/5'
                  }`
                }
                onClick={() => setMenuOpen(false)}
              >
                {t(`nav.${key}`)}
              </NavLink>
            ))}
          </div>
        )}
      </nav>
    </header>
  )
}
