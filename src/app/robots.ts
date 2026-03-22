import { MetadataRoute } from 'next';

/**
 * Directs search crawlers to the sitemap and ensures all public content is indexable.
 * Pointing to .org domain.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin-portal/', 
        '/admin/', 
        '/member-portal/', 
        '/portal/', 
        '/api/'
      ],
    },
    sitemap: 'https://kmhsbeta.org/sitemap.xml',
  };
}
