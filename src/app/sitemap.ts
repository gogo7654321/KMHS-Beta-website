import { MetadataRoute } from 'next';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

/**
 * Generates a dynamic sitemap.xml for Google Search Console.
 * Includes static pages and all published blog posts.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://kmhsbeta.com';

  // Initialize Firebase for server-side generation
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  const db = getFirestore(app);

  // Fetch all published blog posts to include in the sitemap
  let blogUrls: MetadataRoute.Sitemap = [];
  try {
    const blogsQuery = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(blogsQuery);
    
    blogUrls = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as any))
      .filter(post => post.status === 'published')
      .map(post => ({
        url: `${baseUrl}/blog/${post.id}`,
        lastModified: new Date(post.createdAt),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      }));
  } catch (error) {
    console.error('Sitemap Generation: Could not fetch blogs', error);
  }

  // Define static routes
  const staticRoutes = [
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

  return [...staticRoutes, ...blogUrls];
}
