import { MetadataRoute } from 'next';

/**
 * Directs search crawlers to the sitemap and ensures all public content is indexable.
 * This is critical for dominating search results for Kennesaw Mountain High School.
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
    sitemap: 'https://kmhsbeta.com/sitemap.xml',
  };
}
