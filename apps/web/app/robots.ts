import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yiroom.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/home/',
          '/beauty/',
          '/analysis/',
          '/products/',
          '/workout/',
          '/nutrition/',
          '/reports/',
          '/dashboard/',
        ],
        disallow: [
          '/api/',
          '/auth-test/',
          '/storage-test/',
          '/_next/',
          '/sign-in/',
          '/sign-up/',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
