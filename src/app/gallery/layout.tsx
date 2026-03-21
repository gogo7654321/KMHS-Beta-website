import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chapter Photo Gallery',
  description: 'A visual history of our chapter activities, student achievements, and community service impact at Kennesaw Mountain High School.',
};

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
