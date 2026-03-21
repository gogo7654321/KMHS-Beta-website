import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Meet the Leadership',
  description: 'Meet the dedicated students and faculty advisors leading the Kennesaw Mountain High School Beta chapter through service and integrity.',
};

export default function LeadershipLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
