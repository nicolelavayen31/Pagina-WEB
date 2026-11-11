import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // The panel already sends X-Robots-Tag: noindex; this keeps crawlers from requesting it at all.
      disallow: ['/admin', '/api/'],
    },
    sitemap: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/sitemap.xml`,
  };
}
