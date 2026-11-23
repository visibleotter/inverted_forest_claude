import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand palette — see CLAUDE.md. Nothing outside these.
        // Drawn from Monet's morning Seine: willow greens over misty water.
        paper: '#F0EFE3',   // pale misty light — page ground
        glow: '#C7BB74',    // the warm light on the water — accent on dark
        sage: '#8FB0A0',    // misty green of the far water — muted on dark
        moss: '#3D6552',    // mid willow green — secondary text on light
        fern: '#2A4A3A',    // deeper willow — primary and accent on light
        forest: '#16281F',  // darkest willow shadow — dark surfaces, body text
        // The one approved exception (2026-11-23): form errors only.
        // The palette has no colour that reads as "wrong", and stock red
        // failed contrast at 3.5:1. Brick on paper is 6.4:1.
        brick: '#8E3B2F',

        // Semantic tokens (CSS-variable driven)
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
        'accent-foreground': 'rgb(var(--accent-foreground) / <alpha-value>)',
        input: 'rgb(var(--input) / <alpha-value>)',
        destructive: 'rgb(var(--destructive) / <alpha-value>)'
      },
      fontFamily: {
        // Literata for headings and running text, Inter for interface.
        // `display` stays as an alias so older markup keeps resolving.
        serif: ['var(--font-serif)', '"PT Serif"', 'Georgia', 'serif'],
        display: ['var(--font-serif)', '"PT Serif"', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif']
      },
      maxWidth: {
        content: '1120px',
        // Running text: about 64 characters of Literata at 18px.
        prose: '40rem'
      },
      borderRadius: {
        // Squared, bookish: buttons and fields 2px, artwork none.
        card: '2px',
        btn: '2px'
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s ease-out both'
      }
    }
  },
  plugins: []
};

export default config;
