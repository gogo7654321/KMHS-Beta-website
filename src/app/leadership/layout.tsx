import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Leadership',
  description: 'Meet the dedicated students and faculty advisors leading the National Beta Club chapter at Kennesaw Mountain High School.',
};

export default function LeadershipLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
