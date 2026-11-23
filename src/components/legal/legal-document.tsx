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

  // Anchors from the English heading, so a link such as
  // /terms#cancellation-and-refund-policy works in both languages.
  const anchor = (heading: string) =>
    heading.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  return (
    <div className="container-content pb-24 pt-10 sm:pt-16">
      <article className="max-w-prose">
        <h1 className="text-balance text-[34px] leading-[1.15] sm:text-[44px]">
          {lt(doc.title, locale)}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {t('lastUpdated')}: {formatDate(legalLastUpdated, locale)}
        </p>

        <div className="text-body mt-8 space-y-4">
          {doc.intro.map((paragraph, i) => (
            <p key={i}>{fill(lt(paragraph, locale))}</p>
          ))}
        </div>

        {doc.blocks.map((block, i) => (
          <section
            key={i}
            id={block.heading ? anchor(block.heading.en) : undefined}
            className="mt-12 scroll-mt-24"
          >
            {block.heading && (
              <h2 className="text-[24px] leading-tight">
                {lt(block.heading, locale)}
              </h2>
            )}

            <div
              className={
                block.emphasis
                  ? 'mt-4 border-l-2 border-fern bg-card px-5 py-4'
                  : 'mt-4'
              }
            >
              {block.paragraphs?.map((paragraph, j) => (
                <p
                  key={j}
                  className={`${block.emphasis ? 'text-[15px] leading-relaxed' : 'text-body'} ${
                    j > 0 ? 'mt-4' : ''
                  }`}
                >
                  {fill(lt(paragraph, locale))}
                </p>
              ))}

              {block.bullets && (
                <ul
                  className={`text-body list-disc space-y-2 pl-5 marker:text-muted-foreground ${
                    block.paragraphs?.length ? 'mt-4' : ''
                  }`}
                >
                  {block.bullets[locale].map((item) => (
                    <li key={item}>{fill(item)}</li>
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
    </div>
  );
}
