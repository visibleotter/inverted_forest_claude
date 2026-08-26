# Inverted Forest — project instructions

## Colour palette — binding

The site uses this palette and **nothing outside it**. Do not introduce new
hues, do not reach for Tailwind's stock colours (`blue-500`, `zinc-900`,
`emerald-*`…), and do not carry brand colours in from copied components —
adapt them to these tokens instead.

| Token   | Hex       | Role |
| ------- | --------- | ---- |
| `mist`  | `#F7F9FB` | Page background in light mode; text on dark surfaces |
| `sky`   | `#8FC1E3` | Accent **on dark surfaces only** — eyebrows, numbers, high-emphasis buttons |
| `steel` | `#5085A5` | Secondary surfaces, borders, muted text on dark |
| `teal`  | `#31708E` | Primary — buttons and accent text **on light surfaces** |
| `sage`  | `#687864` | The forest note. Decorative and non-text use only (see below) |
| `deep`  | `#12252F` | Dark surfaces and body text in light mode |

`deep` is the one derived value. The five supplied colours contain no true
dark, and without one a dark theme is impossible and accents on dark
sections fail contrast. It is `teal` taken down in lightness, nothing more.

### Contrast rules that follow from the palette

These are measured, not opinion. Breaking them makes text unreadable:

- **`sage`, `teal` and `steel` are near-identical in luminance (1.2–1.4:1).**
  Never place any of them on another. They vanish.
- **`sky` on `teal` is 2.8:1** — fails even for large text. Accents on dark
  surfaces need `deep` as the background, not `teal`.
- **`sky` on `mist` is 1.8:1** — `sky` is never text on a light background.
- **`sage` on `mist` is 4.49:1** — just under AA. Use `sage` for decoration,
  rules, icons and large text, never for small body copy.
- Safe text pairings: `deep` on `mist` (14.9), `mist` on `deep` (14.9),
  `sky` on `deep` (8.2), `teal` on `mist` (5.2), `mist` on `teal` (5.2).

### Which accent where

Because the palette is entirely cool and mid-toned, the accent flips by
surface. This is the rule that is easiest to get wrong:

- **Light surface** → accent is `teal`. Use the semantic `accent` token.
- **Always-dark surface** (hero, footer, nav drawer, dark cards) → accent is
  `sky`, written explicitly. The semantic token follows the theme and would
  render `teal` on dark in light mode, which fails.

Dark sections use `bg-deep text-mist` in both themes rather than swapping
with the theme, so accents on them stay predictable.

## Everything else

Architecture, the data layer and the roadmap: `docs/ARCHITECTURE.md`.
Security and data protection: `docs/SECURITY.md`.
Legal documents and what still needs counsel: `docs/LEGAL-REVIEW.md`.
