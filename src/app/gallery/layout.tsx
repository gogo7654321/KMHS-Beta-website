import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Photo Gallery',
  description: 'A visual history of service impact, student achievements, and leadership activities at Kennesaw Mountain High School.',
};

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
