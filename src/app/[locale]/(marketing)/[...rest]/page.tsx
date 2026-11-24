import { notFound } from 'next/navigation';

/**
 * Catches every address under a locale that matches no page and hands it
 * to `[locale]/not-found.tsx`.
 *
 * Without this, Next rendered its own root 404 for paths like /ru/nope.
 * The root layout is a pass-through with no <html> — the document lives in
 * [locale]/layout.tsx so that `lang` is right — so that 404 had no
 * document around it, React failed to hydrate it, and phones showed a
 * blank white page.
 */
export default function CatchAll() {
  notFound();
}
