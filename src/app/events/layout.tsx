import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Upcoming Events',
  description: 'Stay updated with upcoming service projects, community fundraisers, and leadership meetings at Kennesaw Mountain High School.',
};

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
