# Inverted Forest — project instructions

## Colour palette — binding

Drawn from Monet's morning Seine: willow greens over misty water, with the
pale warm light on the surface as the only non-green note. The site uses
this palette and **nothing outside it**. Do not introduce new hues, do not
reach for Tailwind's stock colours (`blue-500`, `zinc-900`, `emerald-*`…),
and do not carry brand colours in from copied components — adapt them.

| Token    | Hex       | Role |
| -------- | --------- | ---- |
| `paper`  | `#F0EFE3` | Pale misty light. Page ground; text on dark surfaces |
| `glow`   | `#C7BB74` | The warm light on the water. Accent **on dark only** |
| `sage`   | `#8FB0A0` | Misty far water. Muted text and borders **on dark** |
| `moss`   | `#3D6552` | Mid willow. Secondary text **on light** |
| `fern`   | `#2A4A3A` | Deeper willow. Primary and accent **on light** |
| `forest` | `#16281F` | Darkest willow shadow. Dark surfaces; body text on light |

### Contrast rules that follow from the palette

Measured, not opinion:

- **`glow` on `paper` is 1.7:1.** The warm light never sits on a light ground.
- The accent therefore **flips by surface**: `fern` on light, `glow` on dark.
  This is the rule most easily got wrong.
- Safe pairings: `forest` on `paper` (13.4), `paper` on `forest` (13.4),
  `fern` on `paper` (8.5), `glow` on `forest` (8.0), `sage` on `forest`
  (6.6), `moss` on `paper` (5.7).

### How the surface flip is implemented

Do not hand-patch elements. Two classes in `src/styles/globals.css`
redefine the semantic tokens:

- `.surface-dark` — on any always-dark section (hero, footer, nav drawer).
  Anything nested resolves `accent` to glow and `muted-foreground` to sage.
- `.surface-card` — on a light card nested inside a dark section. `Card`
  carries it already.

There is no dark mode. `surface-dark` marks sections that are dark in their
own right, not a theme.

### When changing colours

Measure composited contrast in the browser, not hex values on paper — an
alpha wash over an ancestor is where near-misses hide. Badges have shipped
at 4.46 and 4.28 against a 4.5 requirement, invisible to the eye.

Assign the warm or accent tone to the **high-frequency** roles
(`--primary`, `--accent`). A palette swap that leaves the dominant surfaces
unchanged does not read as a change at all — that has happened once here.

## Everything else

Architecture, the data layer and the roadmap: `docs/ARCHITECTURE.md`.
Security and data protection: `docs/SECURITY.md`.
Legal documents and what still needs counsel: `docs/LEGAL-REVIEW.md`.
