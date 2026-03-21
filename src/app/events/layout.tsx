import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Events',
  description: 'Stay updated with upcoming service projects, community fundraisers, and meeting dates for KMHS Beta Club chapter members.',
};

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
