import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://kmhsbeta.com'; // Replace with your actual domain

  // Define static routes
  const routes = [
    '',
    '/blog',
    '/events',
    '/leadership',
    '/service-hours',
    '/gallery',
    '/contact',
    '/faq',
    '/faq/bylaws',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  return [...routes];
}
