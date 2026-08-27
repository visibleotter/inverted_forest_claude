# Inverted Forest — project instructions

## Colour palette — binding

Derived from Chagall and from Utkin's *Влюблённые. Буря*: an ultramarine
night tempered by crimson and gold, with the misty violet-blue of the
storm. The site uses this palette and **nothing outside it**. Do not
introduce new hues, do not reach for Tailwind's stock colours
(`blue-500`, `zinc-900`, `emerald-*`…), and do not carry brand colours in
from copied components — adapt them to these tokens instead.

| Token    | Hex       | Role |
| -------- | --------- | ---- |
| `linen`  | `#F4EFE6` | Warm paper. Page background in light mode; text on dark surfaces |
| `gold`   | `#D9A441` | Chagall's gold. Accent **on dark surfaces only** |
| `haze`   | `#8E9FD4` | Utkin's storm light. Muted text and borders **on dark** |
| `cobalt` | `#2E4A8A` | The Chagall blue. Primary — buttons and secondary text **on light** |
| `rose`   | `#8E3340` | Deep crimson. Warm accent **on light surfaces only** |
| `night`  | `#16233F` | Night sky. Dark surfaces, and body text in light mode |

### Contrast rules that follow from the palette

Measured, not opinion. Breaking these makes text unreadable:

- **`gold` on `linen` is 1.96:1.** Gold is never text on a light ground.
- **`rose` on `night` is 2.0:1.** Crimson is never text on a dark ground.
- The warm accent therefore **flips by surface**: `rose` on light,
  `gold` on dark. This is the rule most easily got wrong.
- Safe text pairings: `night` on `linen` (13.6), `linen` on `night` (13.6),
  `cobalt` on `linen` (7.5), `linen` on `cobalt` (7.5), `rose` on `linen`
  (6.8), `gold` on `night` (6.9), `haze` on `night` (6.0).

### How the surface flip is implemented

Do not hand-patch elements. Two component classes in
`src/styles/globals.css` redefine the semantic tokens:

- `.surface-dark` — on any section dark in **both** themes (hero, footer,
  nav drawer). Anything nested inside it resolves `accent` to gold and
  `muted-foreground` to haze automatically.
- `.surface-card` — on a light card **nested inside** a dark section, to
  restore theme values. `Card` carries it already.

Dark sections use `surface-dark bg-night text-linen` in both themes rather
than swapping with the theme, so accents on them stay predictable.

### When changing colours

Measure composited contrast in the browser, not hex values on paper — an
alpha wash over an ancestor is where near-misses hide. Two badge washes
previously shipped at 4.46:1 and 4.28:1 against a 4.5 requirement.

## Everything else

Architecture, the data layer and the roadmap: `docs/ARCHITECTURE.md`.
Security and data protection: `docs/SECURITY.md`.
Legal documents and what still needs counsel: `docs/LEGAL-REVIEW.md`.
