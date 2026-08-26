import { getLocale, getTranslations } from 'next-intl/server';
import { legalEntityLine, legalLastUpdated, siteConfig } from '@/lib/config';
import type { LegalDocument } from '@/lib/content/legal';
import type { Locale } from '@/lib/types';
import { formatDate, lt } from '@/lib/utils';

/** Substitutes the runtime tokens used inside the legal texts. */
function fill(text: string): string {
  return text
    .replaceAll('{entity}', legalEntityLine())
    .replaceAll('{email}', siteConfig.contactEmail);
}

export async function LegalDocumentView({ doc }: { doc: LegalDocument }) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations('legal');

  return (
    <article className="container-content max-w-3xl py-16 sm:py-20">
      <h1 className="text-balance text-4xl font-semibold">
        {lt(doc.title, locale)}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {t('lastUpdated')}: {formatDate(legalLastUpdated, locale)}
      </p>

      <div className="mt-8 space-y-4">
        {doc.intro.map((paragraph, i) => (
          <p key={i} className="leading-relaxed text-muted-foreground">
            {fill(lt(paragraph, locale))}
          </p>
        ))}
      </div>

      {doc.blocks.map((block, i) => (
        <section key={i} className="mt-10">
          {block.heading && (
            <h2 className="text-xl font-semibold">
              {lt(block.heading, locale)}
            </h2>
          )}

          <div
            className={
              block.emphasis
                ? 'mt-4 rounded-card border border-border bg-muted/50 p-5'
                : 'mt-4'
            }
          >
            {block.paragraphs?.map((paragraph, j) => (
              <p
                key={j}
                className={`leading-relaxed text-muted-foreground ${
                  j > 0 ? 'mt-4' : ''
                } ${block.emphasis ? 'text-sm' : ''}`}
              >
                {fill(lt(paragraph, locale))}
              </p>
            ))}

            {block.bullets && (
              <ul
                className={`space-y-2.5 ${
                  block.paragraphs?.length ? 'mt-4' : ''
                }`}
              >
                {block.bullets[locale].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 leading-relaxed text-muted-foreground"
                  >
                    <span
                      className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-amber"
                      aria-hidden
                    />
                    <span>{fill(item)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ))}

      <p className="mt-12 border-t border-border pt-6 text-sm text-muted-foreground">
        {lt(doc.governingNote, locale)}
      </p>
    </article>
  );
}
