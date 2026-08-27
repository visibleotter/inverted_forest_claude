import type { MetadataRoute } from 'next';
import { locales } from '@/i18n/routing';
import { siteConfig } from '@/lib/config';
import { getData } from '@/lib/data';

const staticPaths = [
  '',
  '/courses',
  '/about',
  '/faq',
  '/contacts',
  '/privacy',
  '/terms'
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const courses = await getData().getCourses();
  const paths = [
    ...staticPaths,
    ...courses.map((course) => `/courses/${course.slug}`)
  ];

  return paths.flatMap((path) =>
    locales.map((locale) => ({
      url: `${siteConfig.url}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: path === '' ? 1 : path.startsWith('/courses') ? 0.9 : 0.6,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, `${siteConfig.url}/${l}${path}`])
        )
      }
    }))
  );
}
