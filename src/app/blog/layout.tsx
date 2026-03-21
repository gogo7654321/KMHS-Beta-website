import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Latest Stories',
  description: 'Read the latest stories, impact highlights, and chapter news from Kennesaw Mountain High School Beta members leading through service.',
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
