import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Upcoming Events',
  description: 'View the official calendar for Kennesaw Mountain High School Beta. Find meeting dates, service projects, and community fundraiser details for our members.',
};

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
