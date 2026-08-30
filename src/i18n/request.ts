import type { AbstractIntlMessages } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { loadMessages } from '../lib/content/messages';
import type { Locale } from '../lib/types';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as never)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    // JSON defaults with any admin overrides applied on top. Without a
    // database this is exactly the JSON file, so demo mode is unchanged.
    // One cast at the boundary: the catalogue is a nested tree of strings
    // and arrays, which next-intl accepts but cannot express in a type
    // general enough for a dynamically merged object.
    messages: (await loadMessages(
      locale as Locale
    )) as unknown as AbstractIntlMessages
  };
});
