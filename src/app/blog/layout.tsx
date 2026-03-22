import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Impact Stories',
  description: 'Read about the community impact and service projects led by Kennesaw Mountain High School Beta members. Stay updated with our latest news.',
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}