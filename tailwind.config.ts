import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand palette — see CLAUDE.md. Nothing outside these.
        linen: '#F2EAD9',   // warm paper
        gold: '#D9A441',    // Chagall gold — accent on dark only
        haze: '#8E9FD4',    // Utkin storm light — muted text on dark
        cobalt: '#2E4A8A',  // the Chagall blue — primary on light
        rose: '#8E3340',    // deep crimson — warm accent on light only
        night: '#141C3E',   // night sky — dark surfaces, body text on light

        // Semantic tokens (CSS-variable driven, follow light/dark)
        background: 'rgb(var(--background) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        card: 'rgb(var(--card) / <alpha-value>)',
        'card-foreground': 'rgb(var(--card-foreground) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        'muted-foreground': 'rgb(var(--muted-foreground) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        primary: 'rgb(var(--primary) / <alpha-value>)',
        'primary-foreground': 'rgb(var(--primary-foreground) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        'accent-foreground': 'rgb(var(--accent-foreground) / <alpha-value>)'
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif']
      },
      maxWidth: {
        content: '1200px'
      },
      borderRadius: {
        card: '12px',
        btn: '8px'
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        },
        // MagicUI marquee / aurora
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(calc(-100% - 1rem))' }
        },
        'marquee-vertical': {
          from: { transform: 'translateY(0)' },
          to: { transform: 'translateY(calc(-100% - 1rem))' }
        },
        aurora: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' }
        }
      },
      animation: {
        'fade-up': 'fade-up 0.6s ease-out both',
        marquee: 'marquee var(--duration, 60s) linear infinite',
        'marquee-vertical':
          'marquee-vertical var(--duration, 60s) linear infinite',
        aurora: 'aurora 10s ease-in-out infinite'
      }
    }
  },
  plugins: []
};

export default config;
